#!/usr/bin/env python3
"""Gera os icones PNG do PWA sem dependencias externas (zlib + struct).

Os icones do endereco principal e do app da Kelly sao desenhados aqui.
O do app da Anne vem do retrato em `anne-retrato.png`, reduzido para cada tamanho.
"""
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

def dentro_do_coracao(px, py, cx, cy, escala):
    x = (px - cx) / escala
    y = -(py - cy) / escala
    return (x * x + y * y - 1) ** 3 - x * x * y * y * y <= 0


# ---------------------------------------------------------------------------
# Caderninho: endereco principal (roxo->rosa) e app da Kelly (roxo->azul)
# ---------------------------------------------------------------------------

TEMAS = {
    # (cor inicial, cor final, forma)
    'base':  ((139, 92, 246), (236, 72, 153), 'checks'),
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
            elif forma == 'coracao':
                for oy, wdt in ((0, 150), (34, 110)):
                    if rounded(U, V, 168, 340 + oy, 168 + wdt, 356 + oy, 8) < 0:
                        blend(px, i, (196, 181, 253), 1)
                if dentro_do_coracao(U, V, 256, 224, 92):
                    blend(px, i, (139, 92, 246), 1)
    return px


# ---------------------------------------------------------------------------
# Retrato da Anne, a partir de anne-retrato.png
#
# O desenho ja vem com cantos arredondados sobre branco. A mascara redonda que
# o app aplica (raio 112 em 512) corta uma area maior que esses cantos, entao o
# branco some sozinho -- nao ha reconstrucao de canto para fazer.
# ---------------------------------------------------------------------------

ORIGEM_ANNE = os.path.join(os.path.dirname(__file__), 'anne-retrato.png')


def desfiltrar(raw, w, h):
    """Desfaz os filtros por linha do PNG (spec 9.2), RGBA de 8 bits."""
    passo = w * 4
    px = bytearray(w * h * 4)
    anterior = bytearray(passo)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        linha = bytearray(raw[p:p + passo]); p += passo
        if f == 1:
            for x in range(4, passo):
                linha[x] = (linha[x] + linha[x - 4]) & 255
        elif f == 2:
            for x in range(passo):
                linha[x] = (linha[x] + anterior[x]) & 255
        elif f == 3:
            for x in range(passo):
                a = linha[x - 4] if x >= 4 else 0
                linha[x] = (linha[x] + ((a + anterior[x]) >> 1)) & 255
        elif f == 4:
            for x in range(passo):
                a = linha[x - 4] if x >= 4 else 0
                b = anterior[x]
                c = anterior[x - 4] if x >= 4 else 0
                p0 = a + b - c
                pa, pb, pc = abs(p0 - a), abs(p0 - b), abs(p0 - c)
                linha[x] = (linha[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        elif f != 0:
            raise ValueError(f'filtro PNG desconhecido: {f}')
        px[y * passo:(y + 1) * passo] = linha
        anterior = linha
    return px


def ler_png(caminho):
    """Le um PNG RGBA de 8 bits sem entrelacamento. Devolve (lado, pixels)."""
    dados = open(caminho, 'rb').read()
    if dados[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'{caminho} nao e um PNG')
    i, idat, w, h = 8, [], 0, 0
    while i < len(dados):
        n = struct.unpack('>I', dados[i:i + 4])[0]
        tipo = dados[i + 4:i + 8]
        corpo = dados[i + 8:i + 8 + n]
        if tipo == b'IHDR':
            w, h, prof, cor, _, _, entrelace = struct.unpack('>IIBBBBB', corpo)
            if (prof, cor, entrelace) != (8, 6, 0):
                raise ValueError('esperava PNG RGBA de 8 bits sem entrelacamento; '
                                 'reexporte o retrato nesse formato')
        elif tipo == b'IDAT':
            idat.append(corpo)
        elif tipo == b'IEND':
            break
        i += 12 + n
    if w != h:
        raise ValueError(f'o retrato precisa ser quadrado (veio {w}x{h})')
    return w, desfiltrar(zlib.decompress(b''.join(idat)), w, h)


def reduzir(px, lado, novo):
    """Media por area: e' o que da' o antialias ao encolher o desenho."""
    saida = bytearray(novo * novo * 4)
    escala = lado / novo
    for y in range(novo):
        y0 = int(y * escala)
        y1 = min(max(int((y + 1) * escala), y0 + 1), lado)
        for x in range(novo):
            x0 = int(x * escala)
            x1 = min(max(int((x + 1) * escala), x0 + 1), lado)
            r = g = b = a = 0
            for yy in range(y0, y1):
                o = (yy * lado + x0) * 4
                for _ in range(x1 - x0):
                    r += px[o]; g += px[o + 1]; b += px[o + 2]; a += px[o + 3]
                    o += 4
            n = (y1 - y0) * (x1 - x0)
            o = (y * novo + x) * 4
            saida[o] = r // n; saida[o + 1] = g // n
            saida[o + 2] = b // n; saida[o + 3] = a // n
    return saida


def arredondar(px, lado, raio, fundo=None):
    """Corta os cantos: transparentes, ou pintados com `fundo`."""
    for y in range(lado):
        for x in range(lado):
            d = rounded(x + 0.5, y + 0.5, 0, 0, lado, lado, raio)
            if d <= -0.5:
                continue
            dentro = min(1.0, max(0.0, 0.5 - d))
            o = (y * lado + x) * 4
            if fundo is None:
                px[o + 3] = int(px[o + 3] * dentro)
            else:
                for k in range(3):
                    px[o + k] = int(fundo[k] + (px[o + k] - fundo[k]) * dentro)
    return px


def render_anne(size, maskable, lado, origem):
    fundo = tuple(origem[((lado // 2) * lado + 6) * 4 + k] for k in range(3))
    if not maskable:
        return arredondar(reduzir(origem, lado, size), size, round(112 * size / 512))
    # maskable: o desenho encolhe para a area segura e o resto vira fundo cheio
    dentro = round(size * 0.82)
    menor = arredondar(reduzir(origem, lado, dentro), dentro, round(112 * dentro / 512), fundo)
    saida = bytearray(bytes(fundo + (255,)) * (size * size))
    desloc = (size - dentro) // 2
    for y in range(dentro):
        o = ((y + desloc) * size + desloc) * 4
        saida[o:o + dentro * 4] = menor[y * dentro * 4:(y + 1) * dentro * 4]
    return saida


# ---------------------------------------------------------------------------

out = os.path.join(os.path.dirname(__file__), '..', 'public')
alvos = sys.argv[1:] or ['base', 'anne', 'kelly']
lado = origem = None
for tema in alvos:
    if tema == 'anne' and origem is None:
        lado, origem = ler_png(ORIGEM_ANNE)
    sufixo = '' if tema == 'base' else f'-{tema}'
    for nome, size, mask in (
        (f'icon{sufixo}-192.png', 192, False),
        (f'icon{sufixo}-512.png', 512, False),
        (f'icon{sufixo}-512-maskable.png', 512, True),
    ):
        pixels = render_anne(size, mask, lado, origem) if tema == 'anne' else render(size, mask, tema)
        png(os.path.join(out, nome), size, size, pixels)
        print('gerado', nome)
