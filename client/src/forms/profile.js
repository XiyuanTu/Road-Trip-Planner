import React, { useState } from "react";
import { Button, Modal, ListGroup, Form, Alert } from "react-bootstrap";
import { updateUser } from "../API/userAPI";
import ConfirmationModal from "../API/confirmation-modal";

const Profile = ({
  show,
  handleClose,
  user,
  setUser,
  showConfirmModal,
  setShowConfirmModal,
  locationEntries,
  handleDeleteAccount,
  handleSignOut,
}) => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [showUserUpdateAlert, setShowUserUpdateAlert] = useState(false);

  const handleProfileChange = async (e) => {
    e.preventDefault();
    let updatedFields = {};
    let newUser = { ...user };
    if (email != null) {
      updatedFields.email = email;
      newUser.email = email;
    }
    if (password != null) {
      updatedFields.password = password;
    }
    try {
      await updateUser(user._id, updatedFields);
      setUser(newUser);
      setShowUserUpdateAlert(true);
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return (
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>'No user found'</Modal.Title>
        </Modal.Header>
      </Modal>
    );
  }

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{user.username}</Modal.Title>
        </Modal.Header>
        <div style={{ padding: "10px" }}>
          <div>Saved locations:</div>
          {locationEntries && locationEntries.length > 0 ? (
            <ListGroup>
              {locationEntries.map((locationEntry, index) => (
                <ListGroup.Item key={index}>
                  {locationEntry.title}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div
              style={{
                fontSize: "15px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              No favorite locations yet
            </div>
          )}
          <div style={{ border: "1px solid grey", margin: "10px 0" }} />
          <Form onSubmit={handleProfileChange}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Change Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="New email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Change Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="New Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
          <div style={{ border: "1px solid grey", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <button
              style={{}}
              className="btn btn-sm btn-primary btn-login text-uppercase fw-bold mb-2"
              onClick={handleSignOut}
            >
              Logout
            </button>
            <div>
              <button
                style={{}}
                onClick={() => setShowConfirmModal(true)}
                className="btn btn-sm btn-primary btn-danger text-uppercase fw-bold mb-2"
              >
                Wipe Data
              </button>
              <ConfirmationModal
                show={showConfirmModal}
                handleClose={() => setShowConfirmModal(false)}
                handleConfirm={handleDeleteAccount}
                message="Are you sure you want to delete your account and all related data? This action cannot be undone."
              />
            </div>
          </div>
        </div>
      </Modal>
      {showUserUpdateAlert && (
        <Alert
          key={"success"}
          variant={"success"}
          onClose={() => setShowUserUpdateAlert(false)}
          dismissible
          style={{
            zIndex: 9000,
            width: "50%",
            margin: "auto",
            marginTop: "30px",
            fontSize: "15px",
          }}
        >
          User profile updated successfully
        </Alert>
      )}
    </>
  );
};

export default Profile;
