(function () {
    var color = window.color;
    var getset = color.getset;

    color.hoverpoints = function () {
        var options = {
            x: null,
            y: null,
            color: null,
            data: null,
            duration: 50,
            radius: 8,
            distance: 40
        }

        function hoverpoints( el ) { return hoverpoints.draw( el ) }
        hoverpoints.x = getset( options, "x" );
        hoverpoints.y = getset( options, "y" );
        hoverpoints.color = getset( options, "color" );
        hoverpoints.duration = getset( options, "duration" );
        hoverpoints.radius = getset( options, "radius" );
        hoverpoints.distance = getset( options, "distance" );
        hoverpoints.data = getset( options, "data" )
            .set( function ( data ) {
                hoverpoints._xs = data[ 0 ].values.map( function ( point ) {
                    return options.x( point.x );
                });
            });
        hoverpoints.draw = function ( el ) {
            el = el.node ? el.node() : el;

            if ( !el.__hoverpoints ) {
                el.addEventListener( "mousemove", mouseMove );
            }

            return el.__hoverpoints = this;
        }

        return hoverpoints;
    }

    function mouseMove ( ev ) {
        var rect = this.getBoundingClientRect()
        var _hoverpoints = this.__hoverpoints;
        var xs = _hoverpoints._xs;
        var data = _hoverpoints.data();
        var x = _hoverpoints.x();
        var y = _hoverpoints.y();
        var c = _hoverpoints.color();
        var distance = _hoverpoints.distance();
        var radius = _hoverpoints.radius();
        var duration = _hoverpoints.duration();

        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;

        // binary search for the closest x-coordinate in the dataset
        // this is a large dataset, containing possibly thousands of 
        // x-coordinates, so it must be fast
        var ci0 = 0, ci1 = xs.length, ci;
        do {
            ci = ci0 + Math.floor( ( ci1 - ci0 ) / 2 )
            if ( mx > xs[ ci ] ) {
                ci0 = ci;
            } else {
                ci1 = ci;
            }
        } while ( ci1 - ci0 > 1 );
        ci = xs[ ci1 ] - mx > mx - xs[ ci0 ] ? ci0 : ci1;
        var cx = xs[ ci ];

        // filter all of the points for the given x-coordinate that are 
        // close enough to the cursor.
        // this is a much smaller dataset containing only a single x-coord
        var points = [];
        for ( var i = 0 ; i < data.length ; i += 1 ) {
            var point = data[ i ].values[ ci ];
            if ( !point.obj ) {
                continue; // not a real point
            }

            var cy = y( point.y0 + point.y );

            // pythagoras distance between the cursor and the point
            var dist = Math.sqrt(
                Math.pow( Math.abs( cx - mx ), 2 ),
                Math.pow( Math.abs( cy - my ), 2 )
            );

            // are we close enough?
            if ( dist < distance ) {
                var cc = c( data[ i ].key )
                points.push({ x: cx, y: cy, c: cc });
            }
        }

        // draw the points
        var el = d3.select( this );
        var hoverpoints = el.selectAll( "circle[data-line-hoverpoint]" )
            .data( points, function ( p ) { 
                return [ p.x, p.y ].join( "-" )
            });
        hoverpoints.exit()
            .transition()
            .duration( duration )
            .attr( "r", 0 )
            .remove();
        hoverpoints.enter().append( "circle" )
            .attr( "data-line-hoverpoint", "" )
            .attr( "cx", function ( d ) { return d.x } )
            .attr( "cy", function ( d ) { return d.y } )
            .attr( "fill", function ( d ) { return d.c } )
            .attr( "r", 0 );
        hoverpoints.transition()
            .duration( duration )
            .attr( "r", radius )
    }

})();
