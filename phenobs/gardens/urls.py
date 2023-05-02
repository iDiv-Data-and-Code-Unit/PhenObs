from django.urls import include, path
from rest_framework import routers

from phenobs.gardens import views

app_name = "gardens"

router = routers.DefaultRouter()
router.register(r'', views.GardenViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
