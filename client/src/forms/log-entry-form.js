import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { createLogEntry } from "../API/logAPI";

const LogEntryForm = ({ location, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            data.latitude = location.latitude;
            data.longitude = location.longitude;
            await createLogEntry(data);
            onClose();
        } catch (error) {
            console.error(error);
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="entry-form container mt-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
                <label htmlFor="title">Title</label>
                <input name="title" className="form-control" required {...register("title")}/>
            </div>
            <div className="form-group">
                <label htmlFor="comments">Comments</label>
                <textarea name="comments" className="form-control" rows={3} {...register("comments")}></textarea>
            </div>
            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea name="description" className="form-control" rows={3} {...register("description")}></textarea>
            </div>
            <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input name="image" className="form-control" {...register("image")}/>

            </div>
            <div className="form-group">
                <label htmlFor="visitDate">Visit Date</label>
                <input name="visitDate" type="date" className="form-control" required {...register("visitDate")}/>
                {errors.exampleRequired && <div className="alert alert-danger">This field is required</div>}
            </div>
            <button type="submit" className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`} disabled={loading}>
                {loading ? 'Loading...' : 'Create Entry'}
            </button>
        </form>
    );
};

export default LogEntryForm;