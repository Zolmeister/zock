if not Function::bind
  # coffeelint: disable=missing_fat_arrows
  Function::bind = (oThis) ->
    if typeof this isnt 'function'
      # closest thing possible to the ECMAScript 5
      # internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying
      to be bound is not callable')
    aArgs = Array::slice.call(arguments, 1)
    fToBind = this

    fNOP = -> undefined
    fBound = ->
      self = (if this instanceof fNOP then this else oThis)
      fToBind.apply self, aArgs.concat(Array::slice.call(arguments))
    # coffeelint: enable=missing_fat_arrows

    fNOP.prototype = @prototype
    fBound.prototype = new fNOP()
    fBound
