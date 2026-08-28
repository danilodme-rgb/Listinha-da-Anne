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


def dist_polilinha(px, py, pts):
    return min(seg_dist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
               for i in range(len(pts) - 1))


def arco(cx, cy, raio, de_graus, ate_graus, n=24):
    """Pontos ao longo de um arco de circulo, para bocas e olhos piscando."""
    pts = []
    for i in range(n + 1):
        a = math.radians(de_graus + (ate_graus - de_graus) * i / n)
        pts.append((cx + raio * math.cos(a), cy + raio * math.sin(a)))
    return pts


def dentro_do_coracao(px, py, cx, cy, escala):
    x = (px - cx) / escala
    y = -(py - cy) / escala
    return (x * x + y * y - 1) ** 3 - x * x * y * y * y <= 0


TEMAS = {
    # (cor inicial, cor final, forma)
    'base':  ((139, 92, 246), (236, 72, 153), 'checks'),
    'anne':  ((236, 72, 153), (168, 85, 247), 'estrela'),
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
            if forma != 'estrela':
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
                # estrelinha piscando: a "mascote" do app da Anne
                if ponto_no_poligono(U, V, estrela(256, 262, 218, 92)):
                    blend(px, i, (251, 191, 36), 1)
                    # bochechas
                    for bx in (188, 324):
                        r = math.hypot(U - bx, V - 292)
                        if r < 26:
                            blend(px, i, (251, 113, 133), 0.55 * (1 - r / 26))
                    # olho aberto
                    if math.hypot(U - 210, V - 240) < 17:
                        blend(px, i, (67, 20, 7), 1)
                    # olho piscando (arco para cima)
                    if dist_polilinha(U, V, arco(302, 254, 22, 200, 340)) < 8:
                        blend(px, i, (67, 20, 7), 1)
                    # sorriso
                    if dist_polilinha(U, V, arco(256, 288, 40, 25, 155)) < 8:
                        blend(px, i, (67, 20, 7), 1)
            elif forma == 'coracao':
                for oy, wdt in ((0, 150), (34, 110)):
                    if rounded(U, V, 168, 340 + oy, 168 + wdt, 356 + oy, 8) < 0:
                        blend(px, i, (196, 181, 253), 1)
                if dentro_do_coracao(U, V, 256, 224, 92):
                    blend(px, i, (139, 92, 246), 1)
    return px



# ---------------------------------------------------------------------------
# Retrato da Anne (icone do app dela). Tudo desenhado aqui: o repositorio e
# publico, entao nenhuma foto ou imagem de terceiro entra versionada (regra 12b).
# ---------------------------------------------------------------------------

PELE        = (247, 216, 189)
PELE_SOMBRA = (230, 187, 157)
CABELO      = (43, 22, 38)
CABELO_LUZ  = (124, 63, 96)
CABELO_LUZ2 = (166, 96, 133)
OLHO_ESCURO = (46, 24, 22)
IRIS        = (72, 40, 32)
BOCA        = (124, 58, 62)
LABIO       = (226, 146, 148)
DENTE       = (255, 252, 250)
FUNDO_A     = (223, 243, 236)
FUNDO_B     = (203, 234, 231)
CAMISA      = (253, 253, 255)
LISTRA      = (208, 214, 224)
GOLA        = (246, 158, 190)
ESTRELA_VER = (216, 74, 74)
BLUSH       = (244, 150, 150)


def suave(d):
    """Cobertura antialias a partir de uma distancia assinada em pixels."""
    if d <= -0.5: return 1.0
    if d >= 0.5: return 0.0
    return 0.5 - d


def mistura(c0, c1, t):
    return tuple(int(c0[j] + (c1[j] - c0[j]) * t) for j in range(3))


def elipse_d(x, y, cx, cy, rx, ry, ex=2.0, ey=2.0):
    dx = abs(x - cx) / rx
    dy = abs(y - cy) / ry
    f = (dx ** ex + dy ** ey) ** 0.5
    return (f - 1.0) * min(rx, ry)


def perfil(v, pts):
    """Interpolacao suave por uma tabela [(y, largura)]."""
    if v <= pts[0][0]: return pts[0][1]
    for j in range(1, len(pts)):
        if v <= pts[j][0]:
            v0, w0 = pts[j - 1]
            v1, w1 = pts[j]
            u = (v - v0) / (v1 - v0)
            u = u * u * (3 - 2 * u)
            return w0 + (w1 - w0) * u
    return pts[-1][1]


CABELO_PERFIL = [(210, 150), (260, 163), (320, 176), (380, 189),
                 (430, 197), (470, 200), (520, 198)]


def dist_cabelo(u, v):
    """Negativo dentro da massa de cabelo (coroa + duas quedas laterais)."""
    a = abs(u - 256)
    if v < 210:
        d = elipse_d(u, v, 256, 210, 150, 162)
    else:
        # a onda entra aos poucos para nao criar degrau na altura da coroa
        onda = 7.0 * math.sin(v / 46.0) * min(1.0, (v - 210) / 70.0)
        d = a - (perfil(v, CABELO_PERFIL) + onda)
    if v > 300:                       # abre o meio: o cabelo cai dos dois lados
        d = max(d, min(80.0, (v - 300) * 0.75) - a)
    return d


def cor_cabelo(u, v):
    """Mechas cor de ameixa correndo pelo cabelo escuro."""
    s = math.sin(0.050 * (u - 256) + 1.15 * math.sin(v / 68.0) - v / 128.0)
    if s > 0.988: return CABELO_LUZ2
    if s > 0.935: return CABELO_LUZ
    return CABELO


def dist_rosto(u, v):
    return elipse_d(u, v, 256, 230, 88, 124, 2.0, 2.3)


def franja_y(a):
    """Linha do cabelo: risca no meio e as laterais cobrindo ate as macas."""
    return 106 + 0.25 * a + 0.0120 * a * a + 9.0 * math.exp(-(a / 15.0) ** 2)


def ombro_y(a):
    """Decote redondo no meio, ombros caindo para os lados."""
    if a < 78: return 398 + 26 * (1 - (a / 78.0) ** 2)
    return 398 + 0.34 * (a - 78)


def boca_topo(b): return 292.0 + 3.0 * (1 - (b / 38.0) ** 2)
def boca_base(b): return 292.0 + 30.0 * (1 - (b / 38.0) ** 2)


def traco(u, v, pts, esp0, esp1):
    """Distancia a uma polilinha com espessura que afina de esp0 para esp1."""
    melhor = 1e9
    n = len(pts) - 1
    for j in range(n):
        d = seg_dist(u, v, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1])
        e = esp0 + (esp1 - esp0) * (j + 0.5) / n
        if d - e < melhor: melhor = d - e
    return melhor


SOBRANCELHA_E = [(199, 186), (211, 176), (226, 172), (242, 175)]
SOBRANCELHA_D = [(313, 186), (301, 176), (286, 172), (270, 175)]
NARIZ = [(242, 261), (250, 267), (262, 267), (270, 261)]
ESTRELAS = [(244, 468, 21), (310, 508, 17), (188, 510, 16), (302, 460, 14)]
ESTRELAS_POLI = [(cx, cy, r, estrela(cx, cy, r, r * 0.45)) for cx, cy, r in ESTRELAS]


def desenha_retrato(W, maskable):
    S = 512.0
    k = W / S
    pad = 46 if maskable else 0
    scale = (S - 2 * pad) / S
    px = bytearray(bytes(FUNDO_A + (0,)) * (W * W))
    for yy in range(W):
        Y = (yy + 0.5) / k
        for xx in range(W):
            X = (xx + 0.5) / k
            i = (yy * W + xx) * 4
            # maskable e um quadrado cheio; o normal tem os cantos arredondados
            ab = 1.0 if maskable else suave(rounded(X, Y, 0, 0, S, S, 112))
            if ab <= 0: continue
            U = (X - S / 2) / scale + S / 2
            V = (Y - S / 2) / scale + S / 2
            a = abs(U - 256)
            b = U - 256

            blend(px, i, mistura(FUNDO_A, FUNDO_B, (X + Y) / (2 * S)), ab)

            # ---- pescoco, com sombra do queixo
            c = suave(max(a - 42.0, 300.0 - V)) * ab
            if c > 0:
                t = min(1.0, max(0.0, (V - 352.0) / 56.0))
                blend(px, i, mistura(PELE_SOMBRA, PELE, t), c)

            # ---- camisa listrada com estrelinhas
            c = suave(ombro_y(a) - V) * ab
            if c > 0:
                blend(px, i, CAMISA, c)
                if (U + 1024.0) % 21.0 < 2.6:
                    blend(px, i, LISTRA, 0.9 * c)
                for cx, cy, r, poli in ESTRELAS_POLI:
                    if abs(U - cx) < r and abs(V - cy) < r and ponto_no_poligono(U, V, poli):
                        blend(px, i, ESTRELA_VER, c)
                        break
                if a < 88 and abs(V - ombro_y(a)) < 15:
                    blend(px, i, GOLA, c)

            # ---- massa de cabelo (cai na frente da camisa)
            c = suave(dist_cabelo(U, V)) * ab
            if c > 0:
                blend(px, i, cor_cabelo(U, V), c)

            # ---- rosto, recortado pela linha do cabelo (a massa ja cobre a testa)
            dr = dist_rosto(U, V)
            cr = suave(dr) * suave(franja_y(a) - V) * ab
            if cr > 0:
                blend(px, i, PELE, cr)

            if cr <= 0 or V < 150 or V > 340:
                continue

            # ---- bochechas
            for bx in (198, 314):
                r = math.hypot(U - bx, V - 272) / 36.0
                if r < 1:
                    blend(px, i, BLUSH, 0.20 * (1 - r) * cr)

            # ---- olhos
            for ox in (210, 302):
                de = elipse_d(U, V, ox, 226, 27, 15)
                if de < 4:
                    ce = suave(de) * cr
                    if ce > 0:
                        blend(px, i, (255, 255, 255), ce)
                        di = math.hypot(U - ox, V - 227)
                        if di < 14:
                            blend(px, i, IRIS, suave(di - 12.5) * ce)
                            blend(px, i, OLHO_ESCURO, suave(di - 6.0) * ce)
                        if math.hypot(U - (ox - 5), V - 220) < 4.5:
                            blend(px, i, (255, 255, 255), ce)
                    if V < 228 and -4.2 < de:            # linha dos cilios
                        blend(px, i, OLHO_ESCURO, suave(de - 0.4) * cr)
                    elif V > 232 and -2.0 < de:          # palpebra de baixo
                        blend(px, i, OLHO_ESCURO, 0.45 * suave(de - 0.2) * cr)

            # ---- sobrancelhas
            if V < 200:
                for pts in (SOBRANCELHA_E, SOBRANCELHA_D):
                    d = traco(U, V, pts, 4.8, 2.2)
                    if d < 1:
                        blend(px, i, (54, 30, 44), suave(d) * cr)

            # ---- nariz
            if 232 < V < 274 and a < 34:
                r = math.hypot((U - 256) / 15.0, (V - 250) / 26.0)
                if r < 1:
                    blend(px, i, PELE_SOMBRA, 0.28 * (1 - r) * cr)
                d = traco(U, V, NARIZ, 2.4, 2.4)
                if d < 1:
                    blend(px, i, (205, 152, 124), suave(d) * cr)

            # ---- boca: labio, dentes e sorriso
            if 286 < V < 326 and a < 40:
                topo, base = boca_topo(b), boca_base(b)
                cb = suave(max(topo - V, V - base, a - 38.0)) * cr
                if cb > 0:
                    blend(px, i, BOCA, cb)
                    dente_ate = topo + 3.5 + 15.0 * (1 - (b / 34.0) ** 2)
                    if topo + 3.5 < V < min(dente_ate, base - 9.0):
                        blend(px, i, DENTE, cb)
                    elif base - 9.0 < V < base - 2.5:
                        blend(px, i, LABIO, cb)
    return px


def reduz(px, W, ss):
    """Media de blocos ss x ss: o antialias do desenho todo."""
    size = W // ss
    n = ss * ss
    out = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            r = g = bl = al = 0
            for dy in range(ss):
                base = ((y * ss + dy) * W + x * ss) * 4
                for dx in range(ss):
                    j = base + dx * 4
                    r += px[j]; g += px[j + 1]; bl += px[j + 2]; al += px[j + 3]
            o = (y * size + x) * 4
            out[o] = r // n; out[o + 1] = g // n; out[o + 2] = bl // n; out[o + 3] = al // n
    return out


def render_anne(size, maskable):
    ss = 2 if size >= 256 else 3
    return reduz(desenha_retrato(size * ss, maskable), size * ss, ss)


out = os.path.join(os.path.dirname(__file__), '..', 'public')
alvos = sys.argv[1:] or ['base', 'anne', 'kelly']
for tema in alvos:
    sufixo = '' if tema == 'base' else f'-{tema}'
    for nome, size, mask in (
        (f'icon{sufixo}-192.png', 192, False),
        (f'icon{sufixo}-512.png', 512, False),
        (f'icon{sufixo}-512-maskable.png', 512, True),
    ):
        pixels = render_anne(size, mask) if tema == 'anne' else render(size, mask, tema)
        png(os.path.join(out, nome), size, size, pixels)
        print('gerado', nome)
