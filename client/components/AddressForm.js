import { useForm } from 'react-hook-form';

const AddressForm = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Complete Your Profile</h2>
      <p className="text-gray-600 text-center mb-6">Please provide your address information to complete your registration.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Address"
              className="input-field"
              {...register("address", { required: "Address is required" })}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Apt Number (Optional)"
              className="input-field"
              {...register("aptNumber")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="City"
              className="input-field"
              {...register("city", { required: "City is required" })}
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="State"
              className="input-field"
              {...register("state", { required: "State is required" })}
            />
            {errors.state && (
              <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Zip Code"
              className="input-field"
              {...register("zipCode", { 
                required: "Zip code is required",
                pattern: {
                  value: /^\d{5}(-\d{4})?$/,
                  message: "Invalid zip code format"
                }
              })}
            />
            {errors.zipCode && (
              <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Country"
              className="input-field"
              {...register("country", { required: "Country is required" })}
            />
            {errors.country && (
              <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
};

export default AddressForm; 