import httpx
from fastapi import Header, HTTPException, status
from .config import SUPABASE_URL, SUPABASE_SERVICE_KEY


async def get_current_user(authorization: str = Header(...)):
    """
    Validates the Supabase JWT by calling /auth/v1/user with the token.
    Returns {"sub": user_id, "email": email} on success.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")

    token = authorization.split(" ")[1]

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_SERVICE_KEY,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {resp.json().get('msg', resp.text)}",
        )

    data = resp.json()
    return {"sub": data["id"], "email": data["email"]}
