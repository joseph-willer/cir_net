from django.db import models
 
class Files(models.Model):
    name = models.CharField(max_length=30)
    image = models.TextField()
         
    def __unicode__(self):
        return self.name