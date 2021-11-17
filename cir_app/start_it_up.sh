#!/bin/sh

python manage.py makemigrations
python manage.py migrate

sleep 5

python manage.py runserver 0.0.0.0:8000