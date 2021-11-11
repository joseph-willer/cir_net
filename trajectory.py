import pandas as pd
import matplotlib.pyplot as plt

def plotTraj(x, y, vy, vx, dt):
    g = 9.8
    t=0
    data  = []
    while y > 0:
        ay = -g
        y += vy * dt    # use old vy to calculate new y
        vy += ay * dt   # use old ay to calculate new vy
        x += vx * dt
        t += dt
        data.append({'x': x, 'y': y, 't': t})
    df = pd.DataFrame(data)
    df.plot(kind='scatter', x='x', y='y')
    plt.show()
    print('hello')