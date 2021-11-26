from django.db import models
 
class Files(models.Model):
    name = models.CharField(max_length=30)
    image = models.TextField()
         
    def __unicode__(self):
        return self.name

class Circuit(models.Model):
    name = models.CharField(max_length=255)
    pass

class Component(models.Model):
    circuit = models.ForeignKey(Circuit, on_delete=models.CASCADE)
    comp_type = models.CharField(max_length = 40)
    x = models.IntegerField()
    y = models.IntegerField()
    height = models.IntegerField()
    width = models.IntegerField()
    nodes = models.JSONField()
    value = models.JSONField()

class Wire(models.Model):
    circuit = models.ForeignKey(Circuit, on_delete=models.CASCADE)
    x1 = models.IntegerField()
    x2 = models.IntegerField()
    y1 = models.IntegerField()
    y2 = models.IntegerField()
    midpoints = models.JSONField()
    node = models.IntegerField()