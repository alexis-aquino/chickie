import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import Principal, create_access_token, get_current_principal, hash_password, verify_password
from app.db import get_db
from app.seed import seed_demo_data

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _profile(user: models.User) -> schemas.UserProfile:
    return schemas.UserProfile(
        id=str(user.id),
        organization_id=str(user.organization_id),
        name=user.name,
        email=user.email,
        role=user.role,
        avatar=user.avatar_url,
        bio=user.bio,
        phone=user.phone,
        theme=user.theme,
        accent_color=user.accent_color,
        provider=user.provider,
    )


@router.post("/register", response_model=schemas.TokenResponse)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    existing = db.scalar(select(models.User).where(models.User.email == body.email))
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in instead.")

    org = models.Organization(id=str(uuid.uuid4()), name=body.business_name, created_at=datetime.utcnow())
    db.add(org)
    db.flush()

    user = models.User(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        avatar_url=None,
        bio="",
        phone="",
        theme="default",
        accent_color="#dc2626",
        provider="email",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    if body.seed_demo:
        seed_demo_data(db, org.id)

    db.commit()
    return schemas.TokenResponse(access_token=create_access_token(user.id), user=_profile(user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    user = db.scalar(select(models.User).where(models.User.email == body.email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return schemas.TokenResponse(access_token=create_access_token(user.id), user=_profile(user))


@router.get("/me", response_model=schemas.UserProfile)
def me(principal: Principal = Depends(get_current_principal), db: Session = Depends(get_db)) -> schemas.UserProfile:
    user = db.get(models.User, principal.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _profile(user)


@router.patch("/me", response_model=schemas.UserProfile)
def update_me(
    patch: schemas.ProfileUpdate,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> schemas.UserProfile:
    user = db.get(models.User, principal.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if patch.name is not None:
        user.name = patch.name
    if patch.phone is not None:
        user.phone = patch.phone
    if patch.bio is not None:
        user.bio = patch.bio
    if patch.avatar is not None:
        user.avatar_url = patch.avatar
    if patch.theme is not None:
        user.theme = patch.theme
    if patch.accent_color is not None:
        user.accent_color = patch.accent_color

    db.commit()
    return _profile(user)


@router.post("/change-password", status_code=204)
def change_password(
    body: schemas.ChangePasswordRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> None:
    user = db.get(models.User, principal.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    user.password_hash = hash_password(body.new_password)
    db.commit()
