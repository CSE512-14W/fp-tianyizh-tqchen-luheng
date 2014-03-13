#!/usr/bin/python
import sys

def loadfmap( fname ):
    fmap = {}
    ftype = {}
    for l in open( fname ):
        arr = l.split(None, 1)
        if l.strip().startswith('Feature'):
            continue
        if len(arr) < 2:
            continue        

        feat = arr[0].strip()
        if feat == 'Smoker':
            continue
        describ  = arr[1].strip()
        fmap[ feat ] = describ

        if feat == 'Gender':
            ftype[ feat ] = 'cat'
            continue

        if feat == 'State':
            ftype[ feat ] = 'cat'
            continue

        if feat.startswith( 'L2' ):
            ftype[ feat ] = 'c'
            continue

        if describ.find('binary') != -1:
            ftype[ feat ] = 'i'
            continue

        if describ.find('number') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.find('Num') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.find('dose') != -1:
            ftype[ feat ] = 'c'
            continue

        if feat.startswith('Tot'):
            ftype[ feat ] = 'c'
            continue

        if feat.startswith('nomedication'):
            ftype[ feat ] = 'i'
            continue

        if describ.find('prescriptions') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.lower().find('max') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.lower().find('median') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.lower().find('min') != -1:
            ftype[ feat ] = 'c'
            continue

        if feat == 'PrevSmoker':
            ftype[ feat ] = 'sm'
            continue

        if describ.lower().find('total') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.lower().find('active') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.lower().find('visit') != -1:
            ftype[ feat ] = 'c'
            continue

        if describ.find('Range') != -1:
            ftype[ feat ] = 'c'
            continue

        if feat.find('Year') != -1:
            ftype[ feat ] = 'c'
            continue

    print '%d with known type, %d in total' % (len(ftype), len(fmap))
    print 'Unknown types, will be auto decided'
    print [ k for k in fmap.keys() if k not in ftype]

    return fmap, ftype


def checkdata( fname, fmap, ftype ):
    cmap = {}
    for k in fmap.keys():
        cmap[ k ] = {}

    fi = open( fname )
    schema = [ k.strip('\"').strip() for k  in fi.readline().split(',') ]
    infeat = [ k in fmap for k in schema ]
    lcnt = 0
    for l in fi:
        lcnt += 1
        arr = l.split(',')
        assert len(arr) == len(schema)
        for i in xrange( len(arr) ):
            if not infeat[i]:
                continue            
            r = arr[i].strip('\"').strip()

            if schema[i] in ftype:
                tp = ftype[ schema[i] ]
                if tp == 'sm': 
                    assert r == '0' or r == '-1' or r == '1'
                elif tp == 'i':
                    assert r == '1' or r == '0' 
                elif tp == 'c':
                    if r == '-1':
                        cmap[ schema[i] ][ 'unknown' ] = 1                        
                    try:
                        int(r)
                        cmap[ schema[i] ][ 'int' ] = 1
                    except:
                        float(r)
                        cmap[ schema[i] ][ 'float' ] = 1
                elif tp == 'cat':
                    cmap[ schema[i] ][ r ] = 1
                else:
                    # guess try
                    if r == '1' or r == '0':
                        cmap[ schema[i] ]['binary'] = 1
                        continue
                    try:
                        int(r)
                        cmap[ schema[i] ][ 'int' ] = 1
                    except:
                        float(r)
                        cmap[ schema[i] ][ 'float' ] = 1                    
    # remap type
    fntype = {}
    for k in fmap:
        if k in ftype:
            tp = ftype[ k ]
            if tp == 'c':
                if 'float' in cmap[k]:
                    fntype[ k ] = 'float'
                else:
                    fntype[ k ] = 'int'
            else:
                fntype[ k ] = tp
        else:
            if 'unknown' in cmap[k]:
                fntype[k] = 'c'            
            elif 'float' in cmap[k]:
                fntype[ k ] = 'float'
            elif 'int' in cmap[k]:
                fntype[ k ] = 'int'            
            else:
                fntype[ k ] = 'i'            

    print 'check pass: type stats count'
    fcnt = {}
    for k in fntype.itervalues():
        if k not in fcnt:
            fcnt[k] = 1
        else:
            fcnt[ k ] += 1            
            
    print fcnt
    return fntype, cmap, fcnt

def createfmap( fntype, cmap ):
    frmap = {}
    fo = open( 'featmap.txt', 'w' )
    for k, tp in fntype.iteritems():
        if tp == 'cat':
            for nm in cmap[ k ].keys():
                kk = k+'='+nm
                frmap[ kk ] = len(frmap)
                fo.write('%d\t%s\ti\n' % (frmap[kk],kk) )
        elif tp == 'float':
            frmap[ k ] = len(frmap)
            fo.write('%d\t%s\tfloat\n' % (frmap[k],k) )
        elif tp == 'int':
            frmap[ k ] = len(frmap)
            fo.write('%d\t%s\tint\n' % (frmap[k],k) )
        elif tp == 'sm':
            frmap[ k ] = len(frmap)
            fo.write('%d\t%s\ti\n' % (frmap[k],k) )
        else:
            assert tp == 'i'
            frmap[ k ] = len(frmap)
            fo.write('%d\t%s\ti\n' % (frmap[k],k) )            
    fo.close()
    return frmap

def mapdata( fname, frmap, fntype ):
    ycnt = {0:0, 1:0}
    fi = open( fname )
    schema = [ k.strip('\"').strip() for k  in fi.readline().split(',') ]
    infeat = [ k in fmap for k in schema ]

    fo = open( 'fusion.txt', 'w' )
    for l in fi:
        arr = l.split(',')
        flst = []
        for i in xrange( len(arr) ):
            if not infeat[i]:
                continue
            r = arr[i].strip('\"').strip()
            tp = fntype[ schema[i] ]
            if tp == 'cat':
                k = schema[i]+'='+r
                flst.append( (frmap[k],'1') )
            elif tp == 'sm':
                if r != '-1':
                    flst.append( (frmap[schema[i]], 1) )
            else:
                if r != '0':
                    flst.append( (frmap[schema[i]], r) )
        ylabel = int(arr[1])
        assert ylabel == 1 or ylabel == 0 or ylabel == -1
        if ylabel == -1:
            continue
        ycnt[ylabel] += 1
        fo.write('%d\t' % ylabel)
        fo.write('%s\n' % (' '.join( '%d:%s'%(k,v) for k,v in sorted(flst, key=lambda x:x[0]))) )            
    fo.close()
    print 'label stats'
    print ycnt
    
fmap, ftype = loadfmap( 'fmap.raw.txt')
fntype, cmap, fcnt = checkdata( 'Patient.csv', fmap, ftype )
frmap = createfmap( fntype, cmap)
mapdata( 'Patient.csv', frmap, fntype )
print 'all done'

