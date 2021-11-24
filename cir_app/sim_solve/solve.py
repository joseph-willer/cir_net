import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import networkx as nx
import cmath
import math

class Node:
    v = 0
    

    def __init__(self, type='voltage'):
        self.type = type
        if(type=='gnd'):
            self.v=0
        elif(type=='voltage'):
            self.v=0



class Put:
    v = 0
    z = 0
    type = 'none'

    def __init__(self, type, value):
        if(type=='voltage'):
            self.v = value
            self.type = 'voltage-source'
        elif(type=='current'):
            self.i = value
            self.type = 'current-source'
        elif(type=='resistor'):
            self.z = value
            self.type = 'resistor'
        elif(type=='capacitor'):
            self.z = value
            self.type = 'capacitor'
        elif(type=='inductor'):
            self.z = value
            self.type = 'inductor'

def solve(components, frequency):
    print(components)
    G = nx.MultiGraph()
    gnd_node = None
    v_s_count = 0
    v_s_arr = []
    for component in components:
        if(component['type'] == 'voltage'):
            v_s_arr.append(component)
            v_s_count = v_s_count + 1
        elif(component['type'] == 'resistor'):
            G.add_node(component["nodes"][0])
            G.add_node(component["nodes"][1])
            impedence = complex(component['value']['resistance'])
            #print(component["nodes"][0], component["nodes"][1])
            G.add_edge(component["nodes"][0], component["nodes"][1], put=Put(component['type'], impedence))
        elif(component['type'] == 'inductor'):
            G.add_node(component["nodes"][0])
            G.add_node(component["nodes"][1])
            impedence = complex(component['value']['resistance'], 2*math.pi*frequency*component['value']['inductance'])
            #print(component["nodes"][0], component["nodes"][1])
            G.add_edge(component["nodes"][0], component["nodes"][1], put=Put(component['type'], impedence))
        elif(component['type'] == 'capacitor'):
            G.add_node(component["nodes"][0])
            G.add_node(component["nodes"][1])
            impedence = complex(0, (-1/(2*math.pi*frequency*component['value']['capacitance'])))
            #print(component["nodes"][0], component["nodes"][1])
            G.add_edge(component["nodes"][0], component["nodes"][1], put=Put(component['type'], impedence))
        else:
            gnd_node = component["nodes"][0]
    print(v_s_arr)
    matrix = []
    vs = []

    if gnd_node is None:
        previousmax = 0
        for node in G.nodes:
            if(len(list(G.edges(node)))>previousmax):
                previousmax = len(list(G.edges(node)))
                gnd_node = node


    non_gnd_nodes = list(n for n in G.nodes() if n!=gnd_node)
    print(non_gnd_nodes)

    node_count = len(non_gnd_nodes)

    #for edge in list(G.edges.data('put')):
        
        #print(edge[2].type)
    #    if(edge[2].type == 'voltage-source'):
    #        print(edge[0], edge[1], edge[2])
            #print(edge[2].v)
    #        v_s_arr.append(edge)
    #        v_s_count = v_s_count + 1


    addMat = np.zeros((node_count+v_s_count, node_count+v_s_count), dtype=complex)

    #print(list(G.edges.data('put'))[0][2].z)

    for i, nodej in enumerate(non_gnd_nodes):
        for j, nodek in enumerate(non_gnd_nodes):
            if(i==j):
                sum_cond = complex(0)
                #print(sum_cond)
                previous_nodes = (0,0)
                for edge in G.edges(nodej):
                    if(edge==previous_nodes):
                        continue
                    #print("edge: ", edge)
                    sub_sum_cond_inv = complex(0)
                    #print(G[edge[0]][edge[1]])
                    for subedge in G[edge[0]][edge[1]]:
                        #print(G[edge[0]][edge[1]][subedge]['put'].type)
                        if(G[edge[0]][edge[1]][subedge]['put'].type!='voltage-source'):
                            #print("edge resistance: ", G[edge[0]][edge[1]][subedge]['put'].z)
                            sub_sum_cond_inv = sub_sum_cond_inv + 1/G[edge[0]][edge[1]][subedge]['put'].z
                            #print("admittance of ", subedge, sub_sum_cond_inv)
                    if(sub_sum_cond_inv.real**2+sub_sum_cond_inv.imag**2>0):
                        #print(nodej, sub_sum_cond_inv)
                        sum_cond = sum_cond + sub_sum_cond_inv
                        #print(nodej, sum_cond)
                    previous_nodes = edge
                addMat[i][j] = sum_cond
            elif(G.has_edge(nodej, nodek)):
                #print(G[nodej][nodek]['put'].z)
                sub_sum_cond_inv = complex(0)
                for subedge in G[nodej][nodek]:
                    #print(nodej,nodek, G[nodej][nodek][subedge]['put'].z)
                    if(G[nodej][nodek][subedge]['put'].type!='voltage-source'):
                        sub_sum_cond_inv = sub_sum_cond_inv + 1/G[nodej][nodek][subedge]['put'].z
                #print(sub_sum_cond_inv)
                if(sub_sum_cond_inv.real**2+sub_sum_cond_inv.imag**2>0):
                    addMat[i][j] = -1*sub_sum_cond_inv
        for k, v_s in enumerate(v_s_arr):
            print(v_s)
            if(v_s['nodes'][1] == nodej):
                addMat[node_count+k][i] = -1
                addMat[i][node_count+k] = -1
            if(v_s['nodes'][0] == nodej):
                addMat[node_count+k][i] = 1
                addMat[i][node_count+k] = 1
                
    #print(addMat)
    #print(np.linalg.inv(addMat))


    z = np.zeros((len(non_gnd_nodes), 1))
    #print(v_s_arr)
    for k, v_s in enumerate(v_s_arr):
        #print(v_s['nodes'])
        z = np.append(z, v_s['value']['amplitude'])
    print(z)

    vs_is = np.dot(np.linalg.inv(addMat), z)

    voltages = [{"node": gnd_node, "voltage": {'real': 0, 'imag': 0}}]
    currents = []

    for i, node in enumerate(non_gnd_nodes):
        #print("node: ", node, vs_is[i])
        voltages.append({'node': node, 'voltage': {'real': vs_is[i].real, 'imag': vs_is[i].imag}})

    for i, result in enumerate(vs_is):
        if(i<len(non_gnd_nodes)):
            voltages.append({'node': node, 'voltage': {'real': vs_is[i].real, 'imag': vs_is[i].imag}})
        else:
            currents.append({'vs': i, 'current': {'real': vs_is[i].real, 'imag': vs_is[i].imag}})
    return {'voltages': voltages, 'currents': currents}
    
