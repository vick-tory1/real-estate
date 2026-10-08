<?php
session_start();
include('config.php');

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

// Fetch property stats
$totalProperties = $conn->query("SELECT COUNT(*) AS count FROM properties")->fetch_assoc()['count'];
$totalUsers = $conn->query("SELECT COUNT(*) AS count FROM users")->fetch_assoc()['count'];
?>
<h1>Welcome, <?= $_SESSION['username'] ?></h1>
<div>
    <p>Total Properties: <?= $totalProperties ?></p>
    <p>Total Users: <?= $totalUsers ?></p>
    <a href="add_property.php">Add Property</a> |
    <a href="logout.php">Logout</a>
</div>
<table border="1">
    <tr>
        <th>Title</th>
        <th>Type</th>
        <th>Action</th>
        <th>Price</th>
        <th>Location</th>
        <th>Status</th>
        <th>Actions</th>
    </tr>
    <?php
    $properties = $conn->query("SELECT * FROM properties");
    while ($row = $properties->fetch_assoc()) {
        echo "<tr>
                <td>{$row['title']}</td>
                <td>{$row['type']}</td>
                <td>{$row['action']}</td>
                <td>\${$row['price']}</td>
                <td>{$row['location']}</td>
                <td>{$row['status']}</td>
                <td><a href='edit_property.php?id={$row['id']}'>Edit</a> | <a href='delete_property.php?id={$row['id']}'>Delete</a></td>
              </tr>";
    }
    ?>
</table>

