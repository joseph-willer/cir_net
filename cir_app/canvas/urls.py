from django.urls import path

from . import views


urlpatterns = [
    path('', views.canvas, name='canvas'),
    path('<int:cir_pk>', views.canvas, name='canvas'),
    path('solve', views.solve, name='canvas'),
    path('save', views.save, name='canvas'),
    path('load/<int:cir_pk>', views.load, name='load')
]