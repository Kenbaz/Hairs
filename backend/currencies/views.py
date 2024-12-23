# currencies/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Currency
from .serializers import CurrencySerializer, CurrencyConversionSerializer
from .utils import CurrencyConverter


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer


    def get_permissions(self):
        """
            Regular users can only list/retrieve
            Admin users can perform all operations
        
        """
        if self.action in ['list', 'retrieve', 'convert']:
            Permission_classes = [IsAuthenticated]
        else:
            Permission_classes = [IsAdminUser]
        return [permission() for permission in Permission_classes]
    

    def get_queryset(self):
        """ Only return active currencies for non-admin users """
        queryset = Currency.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        return queryset
    

    @action(detail=False, methods=['post'])
    def convert(self, request):
        """ Convert amount between currencies """
        serializer = CurrencyConversionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            converted_amount = CurrencyConverter.convert_price(
                amount=serializer.validated_data['amount'],
                from_currency=serializer._validated_data['from_currency'],
                to_currency=serializer._validated_data['to_currency']
            )

            formatted_amount = CurrencyConverter.format_price(
                amount=converted_amount,
                currency_code=serializer.validated_data['to_currency']
            )

            return Response({
                'amount': converted_amount,
                'formatted': formatted_amount
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=False, methods=['get'])
    def active(self):
        """ Get all active currencies with thier info """
        currencies = CurrencyConverter.get_active_currencies()
        return Response(currencies)


