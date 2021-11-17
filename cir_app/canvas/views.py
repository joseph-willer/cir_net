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
    components = json.loads(request.body)
    voltages = siso_solve.solve(components)
    json_voltages = json.dumps(voltages)
    #for component in json.loads(request.body):
    #    print(component["type"])
    return JsonResponse(voltages, safe=False)