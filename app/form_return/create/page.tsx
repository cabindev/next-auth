'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Toaster, toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { data } from '@/app/data/regions';
import { Progress } from "@/components/ui/progress";
import FormEffect from '@/components/ui/formEffect';
import StepIndicator from '@/components/ui/stepIndicator';

const CreateFormReturn = () => {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [district, setDistrict] = useState('');
  const [amphoe, setAmphoe] = useState('');
  const [province, setProvince] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [type, setType] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [numberOfSigners, setNumberOfSigners] = useState('');
  const [image1, setImage1] = useState<File | null>(null);
  const [imagePreview1, setImagePreview1] = useState<string | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const router = useRouter();

  const allowedExtensions = ['.jpg', '.jpeg', '.webp', '.svg', '.png'];

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<File | null>>,
    setImagePreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(`.${fileExtension}`)) {
        toast.error('Only image files are allowed.');
        return;
      }

      try {
        const options = {
          maxSizeMB: 0.5, // 500 KB
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
        setImage(compressedFile);
      } catch (error) {
        console.error('Error compressing image', error);
        toast.error('Error compressing image');
      }
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const checkPhoneNumberExists = async (phoneNumber: string) => {
    try {
      const response = await axios.get(`/api/form_return/check-phone?phoneNumber=${phoneNumber}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking phone number:', error);
      return false;
    }
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return firstName && lastName && organizationName && addressLine1;
      case 2:
        return district && amphoe && province && zipcode;
      case 3:
        return phoneNumber && numberOfSigners;
      default:
        return true;
    }
  };

  const validateForm = () => {
    if (!firstName || !lastName || !organizationName || !addressLine1 || !district || !amphoe || !province || !zipcode || !phoneNumber || !numberOfSigners) {
      toast.error('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const phoneExists = await checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        toast.error('This phone number is already in use.');
        return;
      }

      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('organizationName', organizationName);
      formData.append('addressLine1', addressLine1);
      formData.append('district', district);
      formData.append('amphoe', amphoe);
      formData.append('province', province);
      formData.append('zipcode', zipcode);
      formData.append('type', type); // ส่งค่า type ไปยังฐานข้อมูล
      formData.append('phoneNumber', phoneNumber);
      formData.append('numberOfSigners', numberOfSigners.toString());
      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);

      const response = await axios.post('/api/form_return', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success('Form submitted successfully.');
        router.push('/form_return');
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('An error occurred while submitting the form.');
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDistrict(value);

    if (value.length > 0) {
      const filteredSuggestions = data
        .filter((region) => region.district.startsWith(value))
        .slice(0, 10);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setDistrict(suggestion.district);
    setAmphoe(suggestion.amphoe);
    setProvince(suggestion.province);
    setZipcode(suggestion.zipcode.toString());
    setType(suggestion.type);
    setSuggestions([]);
  };

  const handleNumberOfSignersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = Number(value.replace(/[^0-9]/g, '')).toLocaleString();
    setNumberOfSigners(formattedValue);
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast.error('Please fill in all required fields.');
    }
  };
  
  const prevStep = () => setStep(step - 1);

  const progressValue = (step / 5) * 100;

  return (
    <div className="bg-orange-100 max-w-4xl mx-auto mt-10 px-4 py-8">
      <Toaster />
      <FormEffect />
      <h4 className="text-lg font-semibold mb-6 text-center text-gray-800">ฟอร์มส่งคืนข้อมูล " งดเหล้าเข้าพรรษา ปี 2567 "</h4>
      <Progress value={progressValue} className="mb-4" />
      <StepIndicator currentStep={step} totalSteps={5} />
      <form onSubmit={handleSubmit} className="space-y-6 bg-orange-200 p-8 rounded-lg shadow-md">
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  ชื่อ
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                ชื่อองค์กร
              </label>
              <input
                type="text"
                name="organizationName"
                id="organizationName"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                ที่อยู่ (เลขที่/หมู่บ้าน)
              </label>
              <input
                type="text"
                name="addressLine1"
                id="addressLine1"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ต่อไป
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                ตำบล/เขต
              </label>
              <input
                type="text"
                name="district"
                id="district"
                required
                value={district}
                onChange={handleDistrictChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
              {suggestions.length > 0 && (
                <ul className="border border-gray-300 mt-1 max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="cursor-pointer p-2 hover:bg-gray-200"
                    >
                      {suggestion.district} - {suggestion.amphoe}, {suggestion.province}, {suggestion.zipcode}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label htmlFor="amphoe" className="block text-sm font-medium text-gray-700">
                อำเภอ
              </label>
              <input
                type="text"
                name="amphoe"
                id="amphoe"
                required
                value={amphoe}
                onChange={(e) => setAmphoe(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                จังหวัด
              </label>
              <input
                type="text"
                name="province"
                id="province"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700">
                รหัสไปรษณีย์
              </label>
              <input
                type="text"
                name="zipcode"
                id="zipcode"
                required
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ต่อไป
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                หมายเลขโทรศัพท์
              </label>
              <input
                type="text"
                name="phoneNumber"
                id="phoneNumber"
                required
                value={phoneNumber}
                onBlur={async () => {
                  const phoneExists = await checkPhoneNumberExists(phoneNumber);
                  if (phoneExists) {
                    toast.error('This phone number is already in use.');
                  }
                }}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
              <small className="text-gray-500">(085-938-77xx)</small>
            </div>
            <div className="form-control">
              <label htmlFor="numberOfSigners" className="block text-sm font-medium text-gray-700">
                จำนวนผู้ลงนาม
              </label>
              <input
                type="text"
                name="numberOfSigners"
                id="numberOfSigners"
                required
                value={numberOfSigners}
                onChange={handleNumberOfSignersChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
              <small className="text-gray-500">(กรอกเฉพาะตัวเลข)</small>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ต่อไป
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <label htmlFor="image1" className="block text-sm font-medium text-gray-700">
                รูปภาพ 1
              </label>
              <input
                type="file"
                name="image1"
                id="image1"
                onChange={(e) => handleImageChange(e, setImage1, setImagePreview1)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
              {imagePreview1 && (
                <div className="mt-4">
                  <Image
                    src={imagePreview1}
                    alt="Image Preview 1"
                    width={200}
                    height={200}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="image2" className="block text-sm font-medium text-gray-700">
                รูปภาพ 2
              </label>
              <input
                type="file"
                name="image2"
                id="image2"
                onChange={(e) => handleImageChange(e, setImage2, setImagePreview2)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-yellow-600 sm:text-sm"
              />
              {imagePreview2 && (
                <div className="mt-4">
                  <Image
                    src={imagePreview2}
                    alt="Image Preview 2"
                    width={200}
                    height={200}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ต่อไป
              </button>
            </div>
          </>
        )}
        
        {step === 5 && (
          <>
            <div>
              <h4 className="text-lg font-semibold mb-6 text-center text-gray-800">Preview and Confirm</h4>
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <p>ชื่อ: {firstName} {lastName}</p>
                <p>ชื่อองค์กร: {organizationName}</p>
                <p>ที่อยู่: {addressLine1}, {district}, {amphoe}, {province}, {zipcode}</p>
                <p>หมายเลขโทรศัพท์: {phoneNumber}</p>
                <p>จำนวนผู้ลงนาม: {numberOfSigners}</p>
                {imagePreview1 && <Image src={imagePreview1} alt="Image 1 Preview" width={200} height={200} className="rounded-md" />}
                {imagePreview2 && <Image src={imagePreview2} alt="Image 2 Preview" width={200} height={200} className="rounded-md" />}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                ยืนยัน
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default CreateFormReturn;
