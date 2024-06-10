import React, { useState, useEffect } from "react";
import axios from "axios";
import "./dataForm.css";
import Navbar from "./navbar";
import jsPDF from "jspdf";

const API_URL = "https://main--serverless-api-lazo.netlify.app/.netlify/functions/api";

function DataForm() {
  const [inventory, setInventory] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(API_URL);
      const inventoryWithId = response.data.map((item, index) => ({ ...item, id: index + 1 }));
      setInventory(inventoryWithId);
      setError(null);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError("Error fetching inventory");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !quantity || !reorderPoint || !age) {
      setError("Name, quantity, reorder point, and age are required");
      return;
    }
    try {
      const method = editItem ? "put" : "post";
      const url = editItem ? `${API_URL}/${editItem._id}` : API_URL;
      await axios[method](url, {
        name,
        quantity: parseInt(quantity),
        reorderPoint: parseInt(reorderPoint),
        age: parseInt(age),
      });
      setName("");
      setQuantity("");
      setReorderPoint("");
      setAge("");
      setEditItem(null);
      setError(null);
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("Error submitting data:", error);
      setError(`Error submitting data: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (id) => {
    const itemToEdit = inventory.find((item) => item._id === id);
    setEditItem(itemToEdit);
    setName(itemToEdit.name);
    setQuantity(itemToEdit.quantity.toString());
    setReorderPoint(itemToEdit.reorderPoint.toString());
    setAge(itemToEdit.age.toString());
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setInventory((prevInventory) => prevInventory.filter((item) => item._id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      setError(`Error deleting item: ${error.response?.data?.message || error.message}`);
    }
  };

  const generateReport = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.text("Fruits Inventory Report", 10, y);
    y += 10;
  
    inventory.forEach((item) => {
      let color = item.quantity <= item.reorderPoint ? 'red' : 'black';
      doc.setTextColor(color);
  
      let message = '';
      if (color === 'red') {
        message = ' - Need to add stocks';
      }

      doc.setFontSize(12);
      doc.text(`Item: ${item.name}, Quantity: ${item.quantity}, Reorder Point: ${item.reorderPoint}${message}`, 10, y);
      y += 10;
    });
  
    doc.save("inventory_report.pdf");
  };

  return (
    <div>
      <div className="heading">
        <Navbar />
      </div>
      <div className="modal-button">
        <button onClick={() => setShowModal(true)}>Add Items</button>
      </div>
      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}></div>}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <form className="add-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Name:
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                  />
                </label>
                <label>
                  Quantity:
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                  />
                </label>
                <label>
                  Reorder Point:
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                    placeholder="Reorder Point"
                  />
                </label>
                <label>
                  Age:
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                  />
                </label>
              </div>
              <button className="add-data" type="submit">{editItem ? 'Update Item' : 'Add Item'}</button>
            </form>
          </div>
        </div>
      )}
      {error && <div className="error-message">Error: {error}</div>}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Reorder</th>
              <th>Age</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id}>
                <td style={{ textAlign: 'center', color: item.quantity <= item.reorderPoint ? 'red' : 'black' }}>{item.id}</td>
                <td style={{ textAlign: 'center', color: item.quantity <= item.reorderPoint ? 'red' : 'black' }}>{item.name}</td>
                <td style={{ textAlign: 'center', color: item.quantity <= item.reorderPoint ? 'red' : 'black' }}>{item.quantity}</td>
                <td style={{ textAlign: 'center' }}>{item.reorderPoint}</td>
                <td style={{ textAlign: 'center' }}>{item.age}</td>
                <td>
                  <div className="buttons">
                    <button className="edit-button" onClick={() => handleEdit(item._id)}>Edit</button>
                    <button className="delete-button" onClick={() => handleDelete(item._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="generate-reports" onClick={generateReport}>Generate Report</button>
    </div>
  );
}

export default DataForm;