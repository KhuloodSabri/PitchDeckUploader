

const signup = (e) => {
    e.preventDefault()
    fetch('/signup',
    {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: $('#username')[0].value,
            password: $('#password')[0].value,
        })
    }).then(response => {
        localStorage.setItem('username', $('#username')[0].value)
        window.location.href='/upload-deck'
    })
}