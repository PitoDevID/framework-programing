from rest_framework import serializers
from .models import Warga

class WargaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warga
        fields = [ 'id', 'nik', 'nama_lengkap', 'alamat', 'no_telepon']