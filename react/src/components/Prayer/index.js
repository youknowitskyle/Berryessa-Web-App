import React, { Component } from "react";
import Popup from "reactjs-popup";

import "./styles.css";

import { AuthUserContext, withAuthorization } from "../Session";
import { withFirebase } from "../Firebase";
import Replies from "./reply";

import * as ROLES from "../../constants/roles";

const PrayerPage = () => (
  <div>
    <h1>Prayer Requests</h1>
    <p>If you need prayer for anything, please submit your request below.</p>
    <Prayers />
  </div>
);

class PrayersBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      isAnonymous: false,
      loading: false,
      prayers: [],
      limit: 5,
      reply: null //becomes id of message
    };
  }

  componentDidMount() {
    this.onListenForPrayers();
  }

  onListenForPrayers() {
    this.setState({ loading: true });

    this.props.firebase
      .prayers()
      .orderByChild("createdAt")
      .limitToLast(this.state.limit)
      .on("value", snapshot => {
        const prayerObject = snapshot.val();

        if (prayerObject) {
          const prayerList = Object.keys(prayerObject).map(key => ({
            ...prayerObject[key],
            uid: key
          }));
          // convert prayers list from snapshot

          this.setState({
            prayers: prayerList,
            loading: false
          });
        } else {
          this.setState({ prayers: null, loading: false });
        }
      });
  }

  componentWillUnmount() {
    this.props.firebase.prayers().off();
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onChangeCheckbox = event => {
    this.setState({ [event.target.name]: event.target.checked });
  };

  onCreatePrayer = (event, authUser) => {
    this.props.firebase.prayers().push({
      text: this.state.text,
      userId: authUser.uid,
      username: authUser.username,
      isAnonymous: this.state.isAnonymous,
      createdAt: this.props.firebase.serverValue.TIMESTAMP
    });

    this.setState({ text: "" });

    event.preventDefault();
  };

  onEditPrayer = (prayer, text) => {
    const { uid, ...prayerSnapshot } = prayer;

    this.props.firebase.prayer(prayer.uid).set({
      ...prayerSnapshot,
      text,
      editedAt: this.props.firebase.serverValue.TIMESTAMP
    });
  };

  onRemovePrayer = uid => {
    this.props.firebase.prayer(uid).remove();
  };

  onNextPage = () => {
    this.setState(
      state => ({ limit: state.limit + 5 }),
      this.onListenForPrayers
    );
  };

  render() {
    const { text, isAnonymous, prayers, loading } = this.state;

    const isInvalid = text === "";

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {!loading && prayers && (
              <button type="button" onClick={this.onNextPage}>
                More
              </button>
            )}

            {loading && <div>Loading ...</div>}

            {prayers ? (
              <PrayerList
                authUser={authUser}
                prayers={prayers}
                onEditPrayer={this.onEditPrayer}
                onRemovePrayer={this.onRemovePrayer}
              />
            ) : (
              <div>There are no prayer requests ...</div>
            )}

            <form onSubmit={event => this.onCreatePrayer(event, authUser)}>
              <input
                name="prayer"
                type="text"
                value={text}
                onChange={this.onChangeText}
                placeholder="Send a prayer request..."
              />
              <label>
                Send Anonymously:{" "}
                <input
                  name="isAnonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={this.onChangeCheckbox}
                />{" "}
              </label>
              <button disabled={isInvalid} type="submit">
                Send
              </button>
            </form>
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const PrayerList = ({ authUser, prayers, onEditPrayer, onRemovePrayer }) => (
  <ul>
    {prayers.map(
      prayer =>
        (authUser.uid === prayer.userId ||
          !!authUser.roles[ROLES.ADMIN] ||
          !!authUser.roles[ROLES.MODERATOR]) && (
          <PrayerItem
            authUser={authUser}
            key={prayer.uid}
            prayer={prayer}
            onEditPrayer={onEditPrayer}
            onRemovePrayer={onRemovePrayer}
          />
        )
    )}
  </ul>
);

class PrayerItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      editText: this.props.prayer.text
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editText: this.props.prayer.text
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onSaveEditText = () => {
    this.props.onEditPrayer(this.props.prayer, this.state.editText);

    this.setState({ editMode: false });
  };

  render() {
    const { authUser, prayer, onRemovePrayer } = this.props;
    const { editMode, editText } = this.state;

    const isInvalid = editText === "";

    return (
      <li>
        {editMode ? (
          <input
            type="text"
            value={editText}
            onChange={this.onChangeEditText}
          />
        ) : (
          <span>
            <strong>
              {prayer.isAnonymous ? "Anonymous" : prayer.username}:{" "}
            </strong>
            {prayer.text}
            {prayer.editedAt && <span>(Edited)</span>}
          </span>
        )}
        {authUser.uid === prayer.userId && (
          <Popup
            trigger={open => (
              <button className="button">{open ? "Close" : ":"}</button>
            )}
            position="right top"
            closeOnDocumentClick
          >
            {editMode ? (
              <span className="card">
                <button
                  className="menu-item"
                  type="button"
                  disabled={isInvalid}
                  onClick={this.onSaveEditText}
                >
                  Save
                </button>
                <button
                  className="menu-item"
                  type="button"
                  onClick={this.onToggleEditMode}
                >
                  Reset
                </button>
              </span>
            ) : (
              <span className="card">
                <button
                  className="menu-item"
                  type="button"
                  onClick={this.onToggleEditMode}
                >
                  Edit
                </button>
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => onRemovePrayer(prayer.uid)}
                >
                  Delete
                </button>
              </span>
            )}
          </Popup>
        )}
        <Popup
          trigger={<button className="button">Reply</button>}
          modal
          closeOnDocumentClick
        >
          <div>
            <span>
              User: {prayer.isAnonymous ? "Anonymous" : prayer.username}
            </span>
            <h1>{prayer.text}</h1>
            <Replies prayer={prayer} />
          </div>
        </Popup>
      </li>
    );
  }
}

class PrayerViewBase extends PrayersBase {
  constructor(props) {
    super(props);
  }

  render() {
    const { prayers, loading } = this.state;

    return (
      <div>
        <AuthUserContext.Consumer>
          {authUser => (
            <div>
              {!loading &&
                prayers && (
                  <button type="button" onClick={this.onNextPage}>
                    More
                  </button>
                )}

              {loading && <div>Loading ...</div>}

              {prayers ? (
                <PrayerList
                  authUser={authUser}
                  prayers={prayers}
                  onEditPrayer={this.onEditPrayer}
                  onRemovePrayer={this.onRemovePrayer}
                />
              ) : (
                <div>There are no prayer requests ...</div>
              )}
            </div>
          )}
        </AuthUserContext.Consumer>
      </div>
    );
  }
}

const Prayers = withFirebase(PrayersBase);
const PrayerView = withFirebase(PrayerViewBase);

const condition = authUser =>
  !!authUser &&
  (!!authUser.roles[ROLES.ADMIN] ||
    !!authUser.roles[ROLES.MODERATOR] ||
    !!authUser.roles[ROLES.APPROVED]);

//or equivalently:
//const condition = authUser => authUser != null;

export default withAuthorization(condition)(PrayerPage);

export { PrayerView };
