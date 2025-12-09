from django.urls import path
from .views import WargaViewSet, PengaduanViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'warga', WargaViewSet, basename='api-warga')
router.register(r'pengaduan', PengaduanViewSet, basename='api-pengaduan')

urlpatterns = [

] + router.urls