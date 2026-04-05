import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // 👉 If uploading FormData, DO NOT force Content-Type
  if (req.body instanceof FormData) {
    const cloned = req.clone({
      setHeaders: token
        ? { Authorization: `Bearer ${token}` }
        : {}
    });

    return next(cloned);
  }

  // 👉 Normal JSON requests
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return next(cloned);
  }

  return next(req);
};
