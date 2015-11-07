(function () {
    var color = window.color;

    color.depth = function depth ( levels ) {
        var keyfn = function ( data ) { return data }

        var fn = function ( data ) {
            if ( levels == 1 ) {
                return data.map( function ( d, i ) {
                    return d;
                })
            }

            // pluck the next level
            data = pluck( data );
            levels -= 1;
            return arguments.callee.call( this, data );
        }

        // pluck a single level out of the hierarchy tree
        function pluck( data ) {
            return data.reduce( function ( level, d ) {
                keyfn( d ).forEach( function ( d1 ) {
                    level.push( d1 );
                })
                return level;
            }, [] )
        }

        fn.key = function ( _keyfn ) {
            if ( arguments.length == 0 ) {
                return keyfn;
            }

            if ( typeof _keyfn == "string" ) {
                var key = _keyfn;
                _keyfn = function ( d ) {
                    return d[ key ];
                }
            }

            keyfn = _keyfn;
            return this;
        }

        return fn;
    }
})()