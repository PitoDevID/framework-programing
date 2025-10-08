from django import forms
from .models import Warga, Pengaduan

class WargaForm(forms.ModelForm):
    class Meta:
        model = Warga
        # Tentukan field mana saja dari model yang ingin ditampilkan di form
        fields = ['nik', 'nama_lengkap', 'alamat', 'no_telepon']

class PengaduanForm(forms.ModelForm):
    class Meta:
        model = Pengaduan
        fields = ['pelapor', 'judul', 'deskripsi', 'status']
        widgets = {
            'pelapor': forms.Select(attrs={'class': 'form-control'}),
            'judul': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Judul pengaduan'}),
            'deskripsi': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Tuliskan isi pengaduan...'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
        }
        