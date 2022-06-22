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
def admin_user(admin_group, user_factory):
    user = user_factory(is_staff=True, status="staff")
    user.groups.set([admin_group])
    return user


@pytest.fixture
def default_user(user, user_group):
    user.is_staff = False
    user.groups.set([user_group])
    return user
