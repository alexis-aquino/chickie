import uuid
from datetime import datetime

import bcrypt

from app.db import SessionLocal
from app.models import Organization, User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "organization_id": user.organization_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "phone": user.phone,
        "theme": user.theme,
        "accent_color": user.accent_color,
        "provider": user.provider,
    }


def register(
    name: str, business_name: str, email: str, password: str, role: str, seed_demo: bool
) -> tuple[dict | None, str | None]:
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == email).first()
        if existing is not None:
            return None, "An account with this email already exists. Please sign in instead."

        org = Organization(id=str(uuid.uuid4()), name=business_name, created_at=datetime.utcnow())
        db.add(org)
        db.flush()

        user = User(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
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

        if seed_demo:
            from app.seed import seed_demo_data

            seed_demo_data(db, org.id)

        db.commit()
        return _user_dict(user), None


def login(email: str, password: str) -> tuple[dict | None, str | None]:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user is None or not verify_password(password, user.password_hash):
            return None, "Incorrect email or password."
        return _user_dict(user), None


def update_profile(user_id: str, **patch) -> dict:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if patch.get("name") is not None:
            user.name = patch["name"]
        if patch.get("phone") is not None:
            user.phone = patch["phone"]
        if patch.get("bio") is not None:
            user.bio = patch["bio"]
        if patch.get("avatar_url") is not None:
            user.avatar_url = patch["avatar_url"]
        if patch.get("theme") is not None:
            user.theme = patch["theme"]
        if patch.get("accent_color") is not None:
            user.accent_color = patch["accent_color"]
        db.commit()
        return _user_dict(user)


def change_password(user_id: str, current_password: str, new_password: str) -> str | None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if not verify_password(current_password, user.password_hash):
            return "Current password is incorrect."
        user.password_hash = hash_password(new_password)
        db.commit()
        return None
