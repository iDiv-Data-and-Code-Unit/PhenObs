import pytest
from django.contrib.auth.models import Group

# from .factories import *


@pytest.fixture
def admin_group():
    group = Group(name="Admins")
    group.save()
    return group


@pytest.fixture
def user_group():
    group = Group(name="Users")
    group.save()
    return group


@pytest.fixture
def admin_user(user, admin_group):
    user.is_staff = True
    user.status = "staff"
    user.groups.add(admin_group)
    return user


@pytest.fixture
def default_user(user, user_group):
    user.is_staff = False
    user.groups.add(user_group)
    return user
