from django.shortcuts import render, HttpResponseRedirect
from django.http import JsonResponse
from .models import Files
import json
from sim_solve import solve as siso_solve

def canvas(request):
    if request.method == 'GET':
        return render(request, 'canvas/canvas.html')
    elif request.method == 'POST':
        print(request.values)
        return HttpResponseRedirect('/')

def solve(request):
    #print(json.loads(request.body))
    data = json.loads(request.body)
    print(data)
    if(type(data)!=list):
        results = siso_solve.solve(data['components'], data['frequency'])
    else:
        results = siso_solve.solve(data, 0.00000000000000000001)
    print(results)
    #for component in json.loads(request.body):
    #    print(component["type"])
    return JsonResponse(results, safe=False)