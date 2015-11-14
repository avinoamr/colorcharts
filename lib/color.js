(function () {
    window.color = {
        identity: identity,
        getset: getset,
        selectUp: selectUp,
        available: available,
        truncate: truncate
    }

    function selectUp ( el, selector ) {
        el = el.node ? el.node() : el;
        while ( el && el.matches && !el.matches( selector ) ) {
            el = el.parentNode;
        }
        return el;
    }

    function identity ( v ) { 
        return v;
    }

    function truncate( maxw ) {
        return function ( texts ) {
            texts.each( function () {
                var v = this.innerHTML;
                var w = this.offsetWidth;

                if ( w > maxw ) {
                    var charSize = w / v.length;
                    var nchars = maxw / charSize;

                    var newv = v.slice( 0, nchars - 3 ) + "...";
                    this.innerHTML = newv + "<title>" + v + "</title>";
                }
            })
        }
    }

    function available ( key ) {
        // determine how much available space we have in each dimension
        return function ( el ) {
            el = selectUp( el, "svg" );
            if ( !el ) {
                throw new Error( "No svg element found" )
            }
            return el.getBoundingClientRect()[ key ];
        }
    }

    function getset ( options, key ) {
        var fn = function ( value ) {
            if ( arguments.length == 0 ) {
                return options[ key ];
            }

            options[ key ] = value;
            return this;
        }

        fn.get = function () {
            var v = fn();
            if ( typeof v == "function" ) {
                v = v.apply( this, arguments );
            }
            return v;
        }
        return fn;
    }
})();
