<?php
include('config.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'];
    $type = $_POST['type'];
    $action = $_POST['action'];
    $price = $_POST['price'];
    $location = $_POST['location'];
    $description = $_POST['description'];

    $stmt = $conn->prepare("INSERT INTO properties (title, type, action, price, location, description) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $title, $type, $action, $price, $location, $description);
    $stmt->execute();
    header('Location: dashboard.php');
}
?>
<form method="POST" action="">
    <input type="text" name="title" placeholder="Property Title" required>
    <select name="type">
        <option value="house">House</option>
        <option value="hotel">Hotel</option>
        <option value="land">Land</option>
    </select>
    <select name="action">
        <option value="sale">Sale</option>
        <option value="buy">Buy</option>
        <option value="rent">Rent</option>
        <option value="lease">Lease</option>
    </select>
    <input type="number" name="price" placeholder="Price" required>
    <input type="text" name="location" placeholder="Location" required>
    <textarea name="description" placeholder="Description"></textarea>
    <button type="submit">Add Property</button>
</form>
