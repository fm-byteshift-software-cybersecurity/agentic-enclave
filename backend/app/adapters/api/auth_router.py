
from fastapi import APIRouter, HTTPException, Request, status

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


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterUserRequest,
    request: Request,
) -> AuthResponse:
    use_case = RegisterUserUseCase(
        user_repository=request.app.state.user_repository,
        password_hasher=request.app.state.password_hasher,
        token_service=request.app.state.token_service,
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

    return AuthResponse(
        user_id=result.user_id,
        email=result.email,
        access_token=result.access_token,
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginUserRequest,
    request: Request,
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
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return AuthResponse(
        user_id=result.user_id,
        email=result.email,
        access_token=result.access_token,
    )
