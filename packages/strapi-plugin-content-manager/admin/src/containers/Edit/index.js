/*
 *
 * Edit
 *
 */

// Dependencies.
import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import PropTypes from 'prop-types';
import { map, get, isObject, isEmpty, replace } from 'lodash';
import { router } from 'app';

// Components.
import EditForm from 'components/EditForm';
import EditFormRelations from 'components/EditFormRelations';
import PluginHeader from 'components/PluginHeader';

// Selectors.
import { makeSelectModels, makeSelectSchema } from 'containers/App/selectors';

// Utils.
import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import templateObject from 'utils/templateObject';
import { checkFormValidity } from '../../utils/formValidations';
import { bindLayout } from '../../utils/bindLayout';

// Layout
import layout from '../../../../config/layout';

// Styles.
import styles from './styles.scss';

// Actions.
import {
  setInitialState,
  setCurrentModelName,
  setIsCreating,
  loadRecord,
  setRecordAttribute,
  editRecord,
  toggleNull,
  cancelChanges,
  setFormValidations,
  setForm,
  setFormErrors,
  recordEdited,
} from './actions';

// Selectors.

import {
  makeSelectRecord,
  makeSelectLoading,
  makeSelectCurrentModelName,
  makeSelectEditing,
  makeSelectDeleting,
  makeSelectIsCreating,
  makeSelectIsRelationComponentNull,
  makeSelectForm,
  makeSelectFormValidations,
  makeSelectFormErrors,
  makeSelectDidCheckErrors,
} from './selectors';

import reducer from './reducer';
import saga from './sagas';

export class Edit extends React.Component {
  constructor(props) {
    super(props);

    this.pluginHeaderActions = [
      {
        label: 'content-manager.containers.Edit.cancel',
        handlei18n: true,
        buttonBackground: 'secondary',
        buttonSize: 'buttonMd',
        onClick: this.props.cancelChanges,
        type: 'button',
      },
      {
        handlei18n: true,
        buttonBackground: 'primary',
        buttonSize: 'buttonLg',
        label: this.props.editing ? 'content-manager.containers.Edit.editing' : 'content-manager.containers.Edit.submit',
        onClick: this.handleSubmit,
        disabled: this.props.editing,
        type: 'submit',
      },
    ];

    this.pluginHeaderSubActions = [
      {
        label: 'content-manager.containers.Edit.returnList',
        handlei18n: true,
        buttonBackground: 'back',
        onClick: () => router.goBack(),
        type: 'button',
      },
    ];

    this.layout = bindLayout.call(this, layout);
  }

  componentDidMount() {
    this.props.setInitialState();
    this.props.setCurrentModelName(this.props.match.params.slug.toLowerCase());
    this.props.setFormValidations(this.props.models[this.props.match.params.slug.toLowerCase()].attributes);
    this.props.setForm(this.props.models[this.props.match.params.slug.toLowerCase()].attributes);
    // Detect that the current route is the `create` route or not
    if (this.props.match.params.id === 'create') {
      this.props.setIsCreating();
    } else {
      this.props.loadRecord(this.props.match.params.id);
    }

    document.addEventListener('keydown', this.handleSubmitOnEnterPress);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleSubmitOnEnterPress);
    this.props.recordEdited();
  }

  handleChange = (e) => {
    if (isObject(e.target.value) && e.target.value._isAMomentObject === true) {
      e.target.value = moment(e.target.value, 'YYYY-MM-DD HH:mm:ss').format();
    }

    this.props.setRecordAttribute(e.target.name, e.target.value);
  }

  handleSubmit = () => {
    const form = this.props.form.toJS();
    map(this.props.record.toJS(), (value, key) => form[key] = value);
    const formErrors = checkFormValidity(form, this.props.formValidations.toJS());

    if (isEmpty(formErrors)) {
      this.props.editRecord();
      if (!isEmpty(this.props.location.search)) {
        router.push(replace(this.props.location.search, '?redirectUrl=', ''));
      } else {
        router.push(replace(this.props.location.pathname, 'create', ''));
      }
    } else {
      this.props.setFormErrors(formErrors);
    }
  }

  handleSubmitOnEnterPress = (e) => {
    if (e.keyCode === 13) {
      this.handleSubmit();
    }
  }

  render() {
    if (this.props.loading || !this.props.schema || !this.props.currentModelName) {
      return <p>Loading...</p>;
    }

    // Plugin header config
    const primaryKey = this.props.models[this.props.currentModelName].primaryKey;
    const mainField = get(this.props.models, `${this.props.currentModelName}.info.mainField`) || primaryKey;
    const pluginHeaderTitle = this.props.isCreating ? 'New entry' : templateObject({ mainField }, this.props.record.toJS()).mainField;
    const pluginHeaderDescription = this.props.isCreating ? 'New entry' : `#${this.props.record && this.props.record.get(primaryKey)}`;

    return (
      <div>
        <div className={`container-fluid ${styles.containerFluid}`}>
          <PluginHeader
            title={{
              id: pluginHeaderTitle,
            }}
            description={{
              id: 'plugin-content-manager-description',
              defaultMessage: `${pluginHeaderDescription}`,
            }}
            actions={this.pluginHeaderActions}
            subActions={this.pluginHeaderSubActions}
            fullWidth={this.props.isRelationComponentNull}
          />
          <div className='row'>
            <div className={this.props.isRelationComponentNull ? `col-lg-12` : `col-lg-9`}>
              <div className={`${styles.main_wrapper}`}>
                <EditForm
                  record={this.props.record}
                  currentModelName={this.props.currentModelName}
                  schema={this.props.schema}
                  setRecordAttribute={this.props.setRecordAttribute}
                  handleChange={this.handleChange}
                  handleSubmit={this.handleSubmit}
                  editing={this.props.editing}
                  formErrors={this.props.formErrors.toJS()}
                  didCheckErrors={this.props.didCheckErrors}
                  formValidations={this.props.formValidations.toJS()}
                  layout={this.layout}
                />
              </div>
            </div>
            <div className={`col-lg-3 ${this.props.isRelationComponentNull ? 'hidden-xl-down' : ''}`}>
              <div className={styles.sub_wrapper}>
                <EditFormRelations
                  currentModelName={this.props.currentModelName}
                  record={this.props.record}
                  schema={this.props.schema}
                  setRecordAttribute={this.props.setRecordAttribute}
                  isNull={this.props.isRelationComponentNull}
                  toggleNull={this.props.toggleNull}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
/* eslint-disable react/require-default-props */
Edit.propTypes = {
  cancelChanges: PropTypes.func.isRequired,
  currentModelName: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
  ]).isRequired,
  didCheckErrors: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  editRecord: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  formErrors: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]),
  formValidations: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]),
  isCreating: PropTypes.bool.isRequired,
  isRelationComponentNull: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  loadRecord: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
    }),
  }).isRequired,
  models: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]).isRequired,
  record: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]).isRequired,
  recordEdited: PropTypes.func,
  schema: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]).isRequired,
  setCurrentModelName: PropTypes.func.isRequired,
  setForm: PropTypes.func.isRequired,
  setFormErrors: PropTypes.func.isRequired,
  setFormValidations: PropTypes.func.isRequired,
  setInitialState: PropTypes.func.isRequired,
  setIsCreating: PropTypes.func.isRequired,
  setRecordAttribute: PropTypes.func.isRequired,
  toggleNull: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  record: makeSelectRecord(),
  loading: makeSelectLoading(),
  currentModelName: makeSelectCurrentModelName(),
  editing: makeSelectEditing(),
  deleting: makeSelectDeleting(),
  isCreating: makeSelectIsCreating(),
  schema: makeSelectSchema(),
  models: makeSelectModels(),
  isRelationComponentNull: makeSelectIsRelationComponentNull(),
  form: makeSelectForm(),
  formValidations: makeSelectFormValidations(),
  formErrors: makeSelectFormErrors(),
  didCheckErrors: makeSelectDidCheckErrors(),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setInitialState,
      setCurrentModelName,
      setIsCreating,
      loadRecord,
      setRecordAttribute,
      editRecord,
      toggleNull,
      cancelChanges,
      setFormValidations,
      setForm,
      setFormErrors,
      recordEdited,
    },
    dispatch
  );
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'edit', reducer });
const withSaga = injectSaga({ key: 'edit', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(Edit);
