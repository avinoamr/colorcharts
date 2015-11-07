(function () {
    var color = window.color;
    color.tree = {};

    color.tree.dfs = function () {
        var filter = function ( d ) { return d };
        var values = function ( d ) { return d };

        var fn = function ( data ) {
            return fn.entries( data )
        }

        fn.entries = function ( data ) {
            return dfs( data, 0, 0 )
        }

        fn.filter = function ( _filter ) {
            filter = _filter;
            return this;
        }

        fn.values = function ( _values ) {
            values = _values;
            return this;
        }

        return fn;

        function dfs( data, i, depth ) {
            var results = [];
            if ( filter( data, i, depth ) ) {
                results.push( data );
            }

            data = values( data, i, depth );

            if ( !Array.isArray( data ) ) {
                return results;
            }

            return data.reduce( function ( results, d, i ) {
                return results.concat( dfs( d, i, depth + 1 ) );
            }, results )
        }
    }
})()