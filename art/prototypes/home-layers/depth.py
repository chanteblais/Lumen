"""Depth, clearance and the walkable floor for a layered isometric room — the Python twin of index.src.html's.

    python3 art/prototypes/home-layers/depth.py        # runs the self-tests

**The depth rule.** One camera, isometric: a ground point (x, y) in painting px has ground coordinates
u = (x + y/B)/2, v = (y/B - x)/2 (B = the iso slope), and toward the camera is +u and +v together. Two ground points in
the same page column (same x = u - v) differ only in u + v, i.e. in page y, so *in the same column, the lower one on
the page is in front*. Lumi is a short ground segment at her feet: page x from fx - half to fx + half, page y = fy.
An item draws over her when some point of its ground polygon (its `extent` if it overhangs, else its `footprint`)
lies in one of her columns with a larger page y than her feet. Items are vertical extrusions of their ground polygon,
so an item with no ground in her columns can only overlap her drawing where it is wider than her feet (the hem, the
hands): for an item with ground within her drawn reach (REACH) but not in her feet columns, the test is made at its
column nearest her feet; an item out of reach can't overlap her and its order doesn't matter. The rule is
exact for a convex polygon that doesn't intersect her segment (the walkable floor keeps them apart); for two items
(`in_front`) it compares their column intervals at the middle of the columns they share.

**Clearance.** Her body is a disc on the ground; a ground circle of page radius r is an ellipse r wide and r·B tall on
the page, so a footprint is grown by an ellipse (24 × 13.7 px), not a page circle: the hull of the polygon's vertices
plus the ellipse's (one hull for a convex polygon, one per edge for a concave one).
"""
import math

HALF = 17          # half her cloak's width at her feet, 120px tall
REACH = 37         # how far her drawing reaches either side of her feet (the stand-in's hem and sleeves: 36.5px)
CLEARANCE = 24     # her body's reach from her feet, page px across


def strip_max_y(poly, a, b):
    """The largest page y of the polygon's boundary within columns a..b, or None if it has none there."""
    best = None
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if a <= x1 <= b:
            best = y1 if best is None else max(best, y1)
        if x1 != x2:
            for c in (a, b):
                if min(x1, x2) <= c <= max(x1, x2):
                    y = y1 + (c - x1) * (y2 - y1) / (x2 - x1)
                    best = y if best is None else max(best, y)
    return best


def column_interval(poly, c):
    """(min y, max y) where column c crosses the polygon, or None."""
    ys = []
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if x1 == x2:
            if x1 == c: ys += [y1, y2]
        elif min(x1, x2) <= c <= max(x1, x2):
            ys.append(y1 + (c - x1) * (y2 - y1) / (x2 - x1))
    return (min(ys), max(ys)) if ys else None


def ground_y_near(poly, fx, half=HALF, reach=REACH):
    """The polygon's lowest page y in her feet columns; failing that, at its column nearest her if that is within her
    drawn reach (her hem is wider than her feet); None if it is out of reach."""
    m = strip_max_y(poly, fx - half, fx + half)
    if m is None:
        gx0, gx1 = min(x for x, _ in poly), max(x for x, _ in poly)
        if gx1 < fx - reach or gx0 > fx + reach:
            return None
        c = min(max(fx, gx0), gx1)
        m = strip_max_y(poly, c, c)
    return m


def draws_over(poly, fx, fy, half=HALF, reach=REACH):
    """Does an item with this ground polygon draw over Lumi standing at (fx, fy)?"""
    m = ground_y_near(poly, fx, half, reach)
    return m is not None and m > fy


def in_front(p, q):
    """+1 if ground polygon p is in front of q, -1 if behind, 0 if they share no column."""
    a = max(min(x for x, _ in p), min(x for x, _ in q))
    b = min(max(x for x, _ in p), max(x for x, _ in q))
    if a > b:
        return 0
    c = (a + b) / 2
    ip, iq = column_interval(p, c), column_interval(q, c)
    if not ip or not iq:
        return 0
    return 1 if (ip[0] + ip[1]) > (iq[0] + iq[1]) else -1


def hull(points):
    pts = sorted(set((round(x, 2), round(y, 2)) for x, y in points))
    if len(pts) < 3:
        return pts
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def convex(poly):
    n, sign = len(poly), 0
    for i in range(n):
        (x0, y0), (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % n], poly[(i + 2) % n]
        z = (x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1)
        if z:
            if sign and (z > 0) != (sign > 0):
                return False
            sign = z
    return True


def grow(poly, r=CLEARANCE, slope=0.57, k=16):
    """Convex polygons covering the footprint grown by her clearance ellipse."""
    ell = [(r * math.cos(2 * math.pi * i / k), r * slope * math.sin(2 * math.pi * i / k)) for i in range(k)]
    plus = lambda pts: [(x + ex, y + ey) for x, y in pts for ex, ey in ell]
    if convex(poly):
        return [[list(p) for p in hull(plus(poly))]]
    return [[list(p) for p in hull(plus([poly[i], poly[(i + 1) % len(poly)]]))] for i in range(len(poly))]


def in_poly(x, y, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def walkable(x, y, floor, blocked):
    return in_poly(x, y, floor) and not any(in_poly(x, y, b) for b in blocked)


def order(polys):
    """Back-to-front order of named ground polygons: a topological sort of in_front, ties by the lowest point."""
    names = list(polys)
    after = {n: set() for n in names}      # after[a] = the names that must be drawn after a
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            f = in_front(polys[a], polys[b])
            if f > 0: after[b].add(a)
            elif f < 0: after[a].add(b)
    indeg = {n: 0 for n in names}
    for a in names:
        for b in after[a]: indeg[b] += 1
    key = lambda n: max(y for _, y in polys[n])
    ready, out = sorted([n for n in names if not indeg[n]], key=key), []
    while ready:
        n = ready.pop(0)
        out.append(n)
        for b in after[n]:
            indeg[b] -= 1
            if not indeg[b]: ready.append(b)
        ready.sort(key=key)
    if len(out) < len(names):          # a cycle: append the rest by their lowest point
        out += sorted([n for n in names if n not in out], key=key)
    return out


if __name__ == '__main__':
    table = [[634, 675], [797, 579], [960, 674], [807, 766]]
    cushion = [[648, 727], [704, 695], [772, 725], [716, 760]]
    cases = [
        ('close behind the table, middle', 797, 555, True),
        ('close behind the table, its back-left edge', 700, 600, True),
        ('in front of the table, below its front corner', 807, 800, False),
        ('left of the table, clear of its columns', 590, 660, False),
        ('left of the table, her cloak over its left corner', 640, 640, True),
        ('right of the table, below its right corner line', 990, 700, False),
    ]
    bad = 0
    for label, x, y, want in cases:
        got = draws_over(table, x, y)
        bad += got != want
        print(f"{'ok ' if got == want else 'BAD'} table over her at ({x},{y}) {label}: {got}")
    f = in_front(cushion, table)
    print(f"{'ok ' if f == 1 else 'BAD'} the cream cushion is in front of the table: {f}")
    bad += f != 1
    print('order:', order({'cushion': cushion, 'table': table}))
    g = grow(table)[0]
    print('grown table hull', len(g), 'points; (797,560) blocked:', in_poly(797, 560, g), '(797,540) blocked:', in_poly(797, 540, g))
    sys_exit = bad
    raise SystemExit(sys_exit)
