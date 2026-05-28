import { useSearchParams } from 'react-router-dom';

export function usePagination() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const setPage = (p) => {
    searchParams.set('page', p);
    setSearchParams(searchParams);
  };
  const setLimit = (l) => {
    searchParams.set('limit', l);
    setSearchParams(searchParams);
  };

  return { page, limit, setPage, setLimit };
}