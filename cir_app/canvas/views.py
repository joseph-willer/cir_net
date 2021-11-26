from django.shortcuts import render, HttpResponseRedirect, get_object_or_404, redirect
from django.http import JsonResponse
from django.core import serializers
from .models import Files, Circuit, Component, Wire
import json
from sim_solve import solve as siso_solve

def canvas(request, cir_pk=None):
    print(cir_pk)
    if request.method == 'GET': #and cir_pk==None:
        return render(request, 'canvas/canvas.html', {'pk': cir_pk})
    #elif request.method == 'GET':
    #    cir = get_object_or_404(Circuit, pk=cir_pk)
    #    wires = serializers.serialize("json", Wire.objects.filter(circuit=cir_pk))
    #    components = serializers.serialize("json", Component.objects.filter(circuit=cir_pk))
    #    print(components)
    #    return render(request, 'canvas/canvas.html', {'pk': cir_pk, 'components': components, 'wires': wires})
    elif request.method == 'POST':
        print(request.values)
        return HttpResponseRedirect('/')

def load(request, cir_pk):
    cir = get_object_or_404(Circuit, pk=cir_pk)
    wires = Wire.objects.filter(circuit=cir_pk).values('midpoints', 'node', 'x1', 'x2', 'y1', 'y2')
    components = Component.objects.filter(circuit=cir_pk).values('comp_type', 'x', 'y', 'height', 'width', 'nodes', 'value')
    results = {'wires': list(wires), 'components': list(components)}
    print(components)
    return JsonResponse(results, safe=False)


def save(request):
    print(request.body)
    data = json.loads(request.body)
    print(data)
    if(data['pk']=='new'):
        cir = Circuit()
        cir.save()
    else:
        cir = Circuit.objects.get(pk=data['pk'])
        Component.objects.filter(circuit=cir).delete()
        Wire.objects.filter(circuit=cir).delete()
    for component in data['components']:
        cir.component_set.create(
            comp_type = component['comp_type'],
            x = component['x'],
            y = component['y'],
            height = component['height'],
            width = component['width'],
            nodes = component['nodes'],
            value = component['value'])
    for wire in data['wires']:
        cir.wire_set.create(
            x1 = wire['x1'],
            x2 = wire['x2'], 
            y1 = wire['y1'],
            y2 = wire['y2'],
            midpoints = wire['midpoints'],
            node = wire['node'])
    return redirect(canvas, cir_pk=cir.id)
    
            

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