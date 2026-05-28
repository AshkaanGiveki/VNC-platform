# Full frontend structure generator with module.scss files for each component/page

$commonComponents = @(
    "Button",
    "Card",
    "Chart",
    "FormField",
    "Loader",
    "Modal",
    "Pagination",
    "ProtectedRoute",
    "Sidebar",
    "Header",
    "Footer",
    "NotificationToast"
)

$layoutComponents = @(
    "DashboardLayout",
    "AuthLayout"
)

$pages = @(
    "auth/Login",
    "auth/ForgotPassword",
    "auth/ResetPassword",
    "admin/Dashboard",
    "admin/Organizations",
    "admin/Images",
    "admin/Logs",
    "manager/Dashboard",
    "manager/Users",
    "manager/Workspaces",
    "manager/Policies",
    "user/Dashboard",
    "user/Workspaces",
    "user/Sessions",
    "user/Files",
    "user/Recordings",
    "user/Notifications",
    "shared/Profile",
    "shared/NotFound"
)

# Create base folders
$baseFolders = @(
    "public",
    "src/assets/images",
    "src/assets/fonts",
    "src/config",
    "src/hooks",
    "src/locales",
    "src/redux/slices",
    "src/services",
    "src/styles",
    "src/utils"
)

foreach ($folder in $baseFolders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

# Create common component folders with index.jsx and index.module.scss
foreach ($comp in $commonComponents) {
    $dir = "src/components/common/$comp"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    New-Item -ItemType File -Path "$dir/index.jsx" -Force | Out-Null
    New-Item -ItemType File -Path "$dir/index.module.scss" -Force | Out-Null
}

# Create layout component folders with style file
foreach ($comp in $layoutComponents) {
    $dir = "src/components/layout/$comp"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    New-Item -ItemType File -Path "$dir/index.jsx" -Force | Out-Null
    New-Item -ItemType File -Path "$dir/index.module.scss" -Force | Out-Null
}

# Create page folders with index.jsx and index.module.scss
foreach ($page in $pages) {
    $dir = "src/pages/$page"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    New-Item -ItemType File -Path "$dir/index.jsx" -Force | Out-Null
    New-Item -ItemType File -Path "$dir/index.module.scss" -Force | Out-Null
}

# Essential config / top-level files
$essentialFiles = @(
    "public/favicon.ico",
    "public/index.html",
    "src/main.jsx",
    "src/App.jsx",
    "src/App.scss",
    "src/router.jsx",
    "src/config/api.js",
    "src/config/routes.js",
    "src/config/theme.js",
    "src/hooks/useAuth.js",
    "src/hooks/useTheme.js",
    "src/hooks/usePagination.js",
    "src/locales/fa.js",
    "src/redux/store.js",
    "src/redux/slices/authSlice.js",
    "src/redux/slices/themeSlice.js",
    "src/redux/slices/uiSlice.js",
    "src/services/apiClient.js",
    "src/services/authService.js",
    "src/services/orgService.js",
    "src/services/userService.js",
    "src/services/workspaceService.js",
    "src/services/sessionService.js",
    "src/services/fileService.js",
    "src/services/notificationService.js",
    "src/services/logService.js",
    "src/services/recordingService.js",
    "src/styles/_variables.scss",
    "src/styles/_mixins.scss",
    "src/styles/_dark.scss",
    "src/styles/_light.scss",
    "src/styles/_rtl.scss",
    "src/styles/global.scss",
    "src/utils/cn.js",
    "src/utils/formatDate.js",
    ".env",
    ".gitignore",
    "package.json",
    "vite.config.js",
    "index.html"
)

foreach ($file in $essentialFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

Write-Host "Frontend structure with module.scss files created!" -ForegroundColor Green