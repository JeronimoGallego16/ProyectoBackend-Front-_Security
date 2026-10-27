import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environment/environment';
import { CreateUserDTO } from '../models/dtos/create-user.dto';
import { UpdateUserDTO } from '../models/dtos/update-user.dto';
import { User } from '../models/user.model';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/users`;
  const user: User = { id: 12, name: 'Ada Lovelace', email: 'ada@example.com' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses the users REST endpoints and request methods', () => {
    service.findAll().subscribe((users) => expect(users).toEqual([user]));
    httpTestingController.expectOne({ method: 'GET', url: baseUrl }).flush([user]);

    service.findById(user.id).subscribe((result) => expect(result).toEqual(user));
    httpTestingController.expectOne({ method: 'GET', url: `${baseUrl}/${user.id}` }).flush(user);

    const createPayload: CreateUserDTO = {
      name: user.name,
      email: user.email,
      password: 'StrongPass1!',
    };
    service.create(createPayload).subscribe((result) => expect(result).toEqual(user));
    httpTestingController.expectOne({
      method: 'POST',
      url: baseUrl,
    }).flush(user);

    const updatePayload: UpdateUserDTO = { name: user.name, email: user.email };
    service.update(user.id, updatePayload).subscribe((result) => expect(result).toEqual(user));
    httpTestingController.expectOne({
      method: 'PUT',
      url: `${baseUrl}/${user.id}`,
    }).flush(user);

    service.delete(user.id).subscribe();
    httpTestingController.expectOne({
      method: 'DELETE',
      url: `${baseUrl}/${user.id}`,
    }).flush(null);
  });
});
