from django.urls import include, path
from rest_framework import routers

from phenobs.observations import views

app_name = "observations"

router = routers.DefaultRouter()
router.register(r'', views.CollectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
