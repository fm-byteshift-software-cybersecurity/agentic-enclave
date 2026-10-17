import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from backend.app.adapters.api.auth_dependencies import get_authenticated_user
from backend.app.adapters.api.auth_schemas import (
    AuthResponse,
    LoginUserRequest,
    RegisterUserRequest,
)
from backend.app.application.use_cases.login_user import (
    InvalidCredentials,
    LoginUserUseCase,
)
from backend.app.application.use_cases.register_user import (
    RegisterUserUseCase,
    UserAlreadyExists,
)
from backend.app.domain.model.user import User


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ACCESS_TOKEN_COOKIE = "access_token"
ACCESS_TOKEN_MAX_AGE = 30 * 60


def _set_access_token_cookie(response: Response, token: str) -> None:
    is_production = os.getenv("APP_ENV", "development").lower() == "production"

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        max_age=ACCESS_TOKEN_MAX_AGE,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/",
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterUserRequest,
    request: Request,
    response: Response,
) -> AuthResponse:
    use_case = RegisterUserUseCase(
        user_repository=request.app.state.user_repository,
        password_hasher=request.app.state.password_hasher,
        token_service=request.app.state.token_service,
        order_repository=request.app.state.order_repository,
    )

    try:
        result = use_case.execute(
            email=payload.email,
            password=payload.password,
        )
    except UserAlreadyExists as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from exc

    _set_access_token_cookie(response, result.access_token)

    return AuthResponse(
        user_id=result.user_id,
        email=result.email,
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginUserRequest,
    request: Request,
    response: Response,
) -> AuthResponse:
    use_case = LoginUserUseCase(
        user_repository=request.app.state.user_repository,
        password_hasher=request.app.state.password_hasher,
        token_service=request.app.state.token_service,
    )

    try:
        result = use_case.execute(
            email=payload.email,
            password=payload.password,
        )
    except InvalidCredentials as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        ) from exc

    _set_access_token_cookie(response, result.access_token)

    return AuthResponse(
        user_id=result.user_id,
        email=result.email,
    )


@router.get("/me", response_model=AuthResponse)
def get_current_user(
    user: User = Depends(get_authenticated_user),
) -> AuthResponse:
    return AuthResponse(
        user_id=user.id,
        email=user.email,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    is_production = os.getenv("APP_ENV", "development").lower() == "production"

    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path="/",
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
