#!/usr/bin/env python3
"""Gera os icones PNG do PWA sem dependencias externas (zlib + struct)."""
import struct, zlib, math, sys, os

def png(path, w, h, pixels):
    raw = b''.join(b'\x00' + bytes(pixels[y*w*4:(y+1)*w*4]) for y in range(h))
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    hdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', hdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def blend(dst, i, color, a):
    if a <= 0: return
    if a > 1: a = 1.0
    for k in range(3):
        dst[i+k] = int(dst[i+k] * (1 - a) + color[k] * a)
    dst[i+3] = int(dst[i+3] * (1 - a) + 255 * a)

def rounded(x, y, rx0, ry0, rx1, ry1, r):
    """distancia assinada negativa dentro do retangulo arredondado"""
    cx = min(max(x, rx0 + r), rx1 - r)
    cy = min(max(y, ry0 + r), ry1 - r)
    return math.hypot(x - cx, y - cy) - r

def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L = vx * vx + vy * vy
    t = 0.0 if L == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L))
    return math.hypot(px - (ax + vx * t), py - (ay + vy * t))

def ponto_no_poligono(px, py, pts):
    dentro = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
            dentro = not dentro
        j = i
    return dentro


def estrela(cx, cy, r_ext, r_int, pontas=5):
    pts = []
    for i in range(pontas * 2):
        ang = -math.pi / 2 + i * math.pi / pontas
        r = r_ext if i % 2 == 0 else r_int
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def dentro_do_coracao(px, py, cx, cy, escala):
    x = (px - cx) / escala
    y = -(py - cy) / escala
    return (x * x + y * y - 1) ** 3 - x * x * y * y * y <= 0


TEMAS = {
    # (cor inicial, cor final, forma)
    'base':  ((139, 92, 246), (236, 72, 153), 'checks'),
    'anne':  ((236, 72, 153), (251, 191, 36), 'estrela'),
    'kelly': ((109, 74, 255), (59, 130, 246), 'coracao'),
}


def render(size, maskable=False, tema='base'):
    c0, c1, forma = TEMAS[tema]
    S = 512.0
    k = size / S
    pad = 46 if maskable else 0          # area segura para icones maskable
    scale = (S - 2 * pad) / S
    px = bytearray([0, 0, 0, 0] * size * size)
    for yy in range(size):
        for xx in range(size):
            X = (xx + 0.5) / k
            Y = (yy + 0.5) / k
            i = (yy * size + xx) * 4
            # fundo com cantos arredondados + degrade roxo->rosa
            d = rounded(X, Y, 0, 0, S, S, 112 if not maskable else 0)
            if d < 1:
                t = (X + Y) / (2 * S)
                col = tuple(int(c0[k] + (c1[k] - c0[k]) * t) for k in range(3))
                blend(px, i, col, min(1.0, 1 - d))
            # coordenadas do desenho interno (encolhidas se maskable)
            U = (X - S / 2) / scale + S / 2
            V = (Y - S / 2) / scale + S / 2
            # argolas do caderno
            for ax in (150, 332):
                if rounded(U, V, ax, 88, ax + 30, 148, 15) < 0:
                    blend(px, i, (253, 230, 138), 1)
            # folha branca
            d2 = rounded(U, V, 118, 112, 394, 412, 34)
            if d2 < 1:
                blend(px, i, (255, 255, 255), min(1.0, 1 - d2))
            if forma == 'checks':
                # tres "check" roxos
                for oy in (0, 86, 172):
                    a = seg_dist(U, V, 168, 214 + oy, 194, 240 + oy)
                    b = seg_dist(U, V, 194, 240 + oy, 240, 184 + oy)
                    if min(a, b) < 12:
                        blend(px, i, (139, 92, 246), min(1.0, 12 - min(a, b)))
                # linhas rosa
                for oy, wdt in ((0, 86), (86, 86), (172, 60)):
                    if rounded(U, V, 266, 206 + oy, 266 + wdt, 226 + oy, 10) < 0:
                        blend(px, i, (249, 168, 212), 1)
            elif forma == 'estrela':
                # duas linhas + estrela grande, para a Anne reconhecer de longe
                for oy, wdt in ((0, 150), (34, 110)):
                    if rounded(U, V, 168, 340 + oy, 168 + wdt, 356 + oy, 8) < 0:
                        blend(px, i, (249, 168, 212), 1)
                if ponto_no_poligono(U, V, estrela(256, 236, 96, 40)):
                    blend(px, i, (251, 146, 60), 1)
            elif forma == 'coracao':
                for oy, wdt in ((0, 150), (34, 110)):
                    if rounded(U, V, 168, 340 + oy, 168 + wdt, 356 + oy, 8) < 0:
                        blend(px, i, (196, 181, 253), 1)
                if dentro_do_coracao(U, V, 256, 224, 92):
                    blend(px, i, (139, 92, 246), 1)
    return px

out = os.path.join(os.path.dirname(__file__), '..', 'public')
for tema in ('base', 'anne', 'kelly'):
    sufixo = '' if tema == 'base' else f'-{tema}'
    for nome, size, mask in (
        (f'icon{sufixo}-192.png', 192, False),
        (f'icon{sufixo}-512.png', 512, False),
        (f'icon{sufixo}-512-maskable.png', 512, True),
    ):
        png(os.path.join(out, nome), size, size, render(size, mask, tema))
        print('gerado', nome)
