//ADD TO CART JAVASCRIPT SECTION


        function addToCart(productName, productPrice, quantity) {
            const totalCost = productPrice * quantity;
            alert(quantity + " x " + productName + 
            " has been added to your cart! Total: $" + totalCost.toFixed(2));
        }


        function increaseQuantity(inputId) {
            const inputElement = document.getElementById(inputId);
            inputElement.value = parseInt(inputElement.value) + 1;
        }


        function decreaseQuantity(inputId) {
            const inputElement = document.getElementById(inputId);
            if (parseInt(inputElement.value) > 1) {
                inputElement.value = parseInt(inputElement.value) - 1;
            }
        }

        const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signUpButton = document.getElementById('signUpButton');

    function validateInputs() {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (email && email.includes('1234567890') && password.length >= 6) {
            signUpButton.disabled = false;
            signUpButton.style.animation = 'growShrink 1s infinite';
        } else {
            signUpButton.disabled = true;
            signUpButton.style.animation = 'none';
        }
    }

    emailInput.addEventListener('input', validateInputs);
    passwordInput.addEventListener('input', validateInputs);

    // TOGGLE PASSWORD INVISIBILITY SECTION

    function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('toggleIcon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            }
        }