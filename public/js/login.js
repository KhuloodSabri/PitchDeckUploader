

const login = (e) => {
    e.preventDefault()
  
    fetch('/login',
    {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: $('#username')[0].value,
            password: $('#password')[0].value,
        })
    }).then(response => {
        if(response.status === 200) {
            localStorage.setItem('username', $('#username')[0].value)
            window.location.href='/upload-deck'
        }
    })
}