from django.urls import path
from . import views

app_name = "home"

urlpatterns = [
    path('', views.home, name="home"),
    path('meptember24', views.meptember24, name="meptember24"),
    path('increment/', views.increment_counter, name='increment_counter'),
    path('generate-image/', views.generate_image, name='generate_image'),
    path('reineistriauki', views.reineistriauki, name="reineistriauki"),
    path('mepzine', views.mepzine, name="mepzine"),
    path('meptember26', views.meptember26, name="meptember26"),
]