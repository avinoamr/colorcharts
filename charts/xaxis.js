(function () {
    var color = window.color;
    var getset = color.getset;

    color.xaxis = function () {
        var options = {
            x: null,
            y: null,
            data: null
        };
        
        function xaxis () { 
            return xaxis.draw( this ) 
        }

        xaxis.x = getset( options, "x" );
        xaxis.y = getset( options, "y" );
        xaxis.data = getset( options, "data" );
        xaxis.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( xaxis, xaxis.data() || data );
                draw( xaxis, this, data );  
            })
            return this;
        }

        return xaxis;
    }

    function layout ( that, data ) {
        return data;
    }

    function draw ( that, el, data ) {
        var x = that.x();
        var y = that.y();
        var xAxis = d3.svg.axis()
            .scale( x )
            .orient( "bottom" )
            .tickSize( 10, 0 )
            .ticks( 7 );

        var maxh = 0;
        el = d3.select( el );
        el.call( xAxis )
            .each( function () {
                d3.select( this )
                    .selectAll( "path.domain" )
                    .attr( "fill", "white" );
            })
            .selectAll( "g.tick" )
                .each( function () {
                    var tick = d3.select( this );
                    var text = tick.select( "text" )
                    maxh = Math.max( maxh, text.node().offsetHeight );
                });

        maxh = maxh ? maxh + 8 : 0; 
        y.range([ 
            y.range()[ 0 ] - maxh, 
            y.range()[ 1 ] 
        ])
    }


})();