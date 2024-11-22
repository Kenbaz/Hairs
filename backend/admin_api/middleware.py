from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_token(token_key):
    try:
        # Decode the token
        access_token = AccessToken(token_key)
        user_id = access_token.payload.get('user_id')

        # Get user from database
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        # Print debug info
        print(f"Authenticated user: {user.email} (Staff: {user.is_staff})")
        return user
    except Exception as e:
        print(f"Token authentication failed: {str(e)}")
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get query parameters
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        # Get token from query parameters
        token = query_params.get('token', [None])[0]

        if token:
            # Debug print first 10 chars
            print(f"Token received: {token[:10]}...")
            scope['user'] = await get_user_from_token(token)
        else:
            print("No token received")
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
