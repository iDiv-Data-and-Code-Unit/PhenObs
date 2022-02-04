from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import include, path
from django.views import defaults as default_views
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView

from . import views

urlpatterns = [
    path("", include("pwa.urls")),
    # path("", views.index, name="index"),
    path("", views.home, name="home"),
 #    path(
 #       "favicon.ico",
 #       RedirectView.as_view(
 #           url=staticfiles_storage.url("images/favicons/favicon.ico")
#        ),
#    ),
    path(
        "observations/", include("phenobs.observations.urls", namespace="observations")
    ),
    path(
        "imprint/", TemplateView.as_view(template_name="pages/imprint.html"), name="imprint"),
    # Django Admin, use {% url 'admin:index' %}
    path(settings.ADMIN_URL, admin.site.urls),
    # User management
    path("users/", include("phenobs.users.urls", namespace="users")),
    path("200/", TemplateView.as_view(template_name="200.html"), name="ok"),
    path("offline/", TemplateView.as_view(template_name="offline.html"), name="offline"),
    path("accounts/", include("allauth.urls")),
    # Your stuff: custom urls includes go here
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


if settings.DEBUG:
    # This allows the error pages to be debugged during development, just visit
    # these url in browser to see how these error pages look like.
    urlpatterns += [
        path(
            "400/",
            default_views.bad_request,
            kwargs={"exception": Exception("Bad Request!")},
        ),
        path(
            "403/",
            default_views.permission_denied,
            kwargs={"exception": Exception("Permission Denied")},
        ),
        path(
            "404/",
            default_views.page_not_found,
            kwargs={"exception": Exception("Page not Found")},
        ),
        path("500/", default_views.server_error),
    ]
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
