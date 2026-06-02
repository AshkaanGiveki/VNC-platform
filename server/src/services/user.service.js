const User = require('../models/User');
const Organization = require('../models/Organization');
const { ROLES } = require('../utils/constants');
const { NotFoundError, ConflictError, AuthorizationError } = require('../utils/errors');
const { logAction } = require('./log.service');
const logger = require('../utils/logger');

const hierarchy = {
    superadmin: 4,
    manager: 3,
    org_admin: 2,
    user: 1,
};

function canModifyUser(actor, targetUser) {
    const actorLevel = hierarchy[actor.role] || 0;
    const targetLevel = hierarchy[targetUser.role] || 0;
    return actorLevel > targetLevel;
}


/**
 * Create a new user under an organization.
 * @param {object} params
 * @param {object} params.actor          - The admin/manager performing the action (req.user)
 * @param {string} params.organizationId - The target organization (from route/body)
 * @param {object} params.userData       - { email, password, firstName, lastName, role? }
 * @returns {Promise<object>} Created user (without password).
 */
async function createUser({ actor, organizationId, userData }) {
    // Authorization: only org_admin or manager can create users in their own org
    // Superadmin can create users in any organization
    if (actor.role !== ROLES.SUPERADMIN) {
        if (!actor.organizationId || actor.organizationId.toString() !== organizationId.toString()) {
            throw new AuthorizationError('You can only create users in your own organization');
        }
    }

    if (actor.role === ROLES.ORG_ADMIN && (userData.role && userData.role !== ROLES.USER)) {
        throw new AuthorizationError('Admins can only create regular users');
    }

    if (![ROLES.SUPERADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER].includes(actor.role)) {
        throw new AuthorizationError('Insufficient permissions to create users');
    }

    // Ensure organization exists
    const org = await Organization.findById(organizationId);
    if (!org) throw new NotFoundError('Organization not found');

    // Check user limit
    const userCount = await User.countDocuments({ organizationId });
    if (userCount >= org.settings.maxUsers) {
        throw new ConflictError(`Organization has reached its maximum user limit (${org.settings.maxUsers})`);
    }

    // Prevent creating superadmins through this route
    if (userData.role && userData.role === ROLES.SUPERADMIN) {
        throw new AuthorizationError('Cannot create superadmin users via organization');
    }

    // Check if email already exists in that organization
    const existingUser = await User.findOne({ email: userData.email.toLowerCase(), organizationId });
    if (existingUser) {
        throw new ConflictError('کاربری با همین ایمیل در سازمان وجود دارد');
    }

    const newUser = await User.create({
        ...userData,
        email: userData.email.toLowerCase(),
        organizationId,
    });

    // Log the action
    await logAction({
        action: 'user.created',
        resource: 'user',
        resourceId: newUser._id,
        userId: actor.userId,
        organizationId,
        details: { createdUserEmail: newUser.email, role: newUser.role },
        ip: actor.ip || '',
    });

    logger.info(`User created: ${newUser.email} in org ${organizationId}`);

    // Return user without password
    const userObj = newUser.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    return userObj;
}

/**
 * List users in an organization with pagination.
 * @param {object} params
 * @param {string} params.organizationId
 * @param {object} params.queryParams - { page, limit, sort, order, role?, search? }
 * @returns {Promise<{users: Array, meta: object}>}
 */
async function listUsers({ organizationId, queryParams }) {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(queryParams);

    const filter = { organizationId };
    if (queryParams.role) {
        filter.role = queryParams.role;
    }
    if (queryParams.search) {
        const searchStr = queryParams.search.trim();

        if (searchStr.includes(' ')) {
            // Phrase search against concatenated full name
            // Escape regex-special characters
            const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$expr = {
                $regexMatch: {
                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                    regex: escaped,
                    options: 'i',
                },
            };
        } else {
            // Single word – search firstName, lastName, or email
            const regex = { $regex: searchStr, $options: 'i' };
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
            ];
        }
    }

    const [users, total] = await Promise.all([
        applyPagination(User.find(filter).select('-password -refreshTokens'), pagination).lean(),
        User.countDocuments(filter),
    ]);

    return { users, meta: buildMeta(total, pagination) };
}

/**
 * Get a single user by ID.
 * @param {string} userId
 * @param {string} organizationId - For scoping (ensures user belongs to org).
 * @returns {Promise<object>}
 */
async function getUserById(userId, organizationId) {
    const query = { _id: userId };
    if (organizationId) query.organizationId = organizationId;

    const user = await User.findOne(query).select('-password -refreshTokens');
    if (!user) throw new NotFoundError('User not found');
    return user;
}

/**
 * Update a user's details (name, role, isActive).
 * @param {object} params
 * @param {object} params.actor
 * @param {string} params.userId
 * @param {object} params.updates - fields to update.
 * @returns {Promise<object>} Updated user.
 */

async function updateUser({ actor, userId, updates }) {
    const targetUser = await User.findById(userId);
    if (!targetUser) throw new NotFoundError('User not found');

    if (!canModifyUser(actor, targetUser)) {
        throw new AuthorizationError('You cannot modify a user with equal or higher role');
    }

    // Admin cannot change roles
    if (actor.role === ROLES.ORG_ADMIN && updates.role) {
        throw new AuthorizationError('Admins cannot change roles');
    }

    // Admin can only modify regular users
    if (actor.role === ROLES.ORG_ADMIN && targetUser.role !== ROLES.USER) {
        throw new AuthorizationError('Admins can only modify regular users');
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) throw new NotFoundError('User not found');

    await logAction({
        action: 'user.updated',
        resource: 'user',
        resourceId: user._id,
        userId: actor.userId,
        organizationId: user.organizationId,
        details: updates,
    });

    logger.info(`User updated: ${user.email}`);
    return user;
}

async function deleteUser({ actor, userId }) {
    const targetUser = await User.findById(userId);
    if (!targetUser) throw new NotFoundError('User not found');

    if (!canModifyUser(actor, targetUser)) {
        throw new AuthorizationError('You cannot delete this user');
    }

    await User.findByIdAndDelete(userId);

    await logAction({
        action: 'user.deleted',
        resource: 'user',
        resourceId: userId,
        userId: actor.userId,
        organizationId: targetUser.organizationId,
    });

    logger.warn(`User deleted: ${targetUser.email}`);
}

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };