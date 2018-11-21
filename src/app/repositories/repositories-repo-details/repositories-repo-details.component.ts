import { Component, OnInit, OnDestroy } from '@angular/core';
import { RepositoriesService } from '../shared/repositories.service';
import { Repository, AccessToken, EnvForm } from '../shared/repository.model';
import { ActivatedRoute } from '@angular/router';
import { BuildService } from '../../builds/shared/build.service';
import { User } from '../../team/shared/team.model';
import { AuthService } from '../../shared/providers/auth.service';

@Component({
  selector: 'app-repositories-repo-details',
  templateUrl: './repositories-repo-details.component.html',
  styleUrls: ['./repositories-repo-details.component.sass']
})
export class RepositoriesRepoDetailsComponent implements OnInit, OnDestroy {
  tab: 'builds' | 'settings' | 'check';
  id: number;
  repo: Repository;
  fetchingRepository: boolean;
  limit: number;
  offset: number;
  accessTokens: AccessToken[] = [];
  tokenOptions: { value: string | number, placeholder: string }[] = [];
  fetchingAccessTokens: boolean;
  envVariablesForm: EnvForm = new EnvForm('', '', false);
  encryptedOptions = [{ value: true, placeholder: 'Encrypted' }, { value: false, placeholder: 'Plain' }];

  constructor(
    public service: RepositoriesService,
    public route: ActivatedRoute,
    public buildService: BuildService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.tab = 'settings';
    this.id = this.route.snapshot.params.id;
    this.fetchRepository();
    // this.buildService.resetFields();
    // this.buildService.fetchBuilds(this.id);
  }

  ngOnDestroy() {
    this.repo = null;
    // this.buildService.resetFields();
    // this.buildService.unsubscribeFromBuilds();
  }

  switchTab(tab: 'builds' | 'settings' | 'check'): void {
    if (this.tab === tab) {
      return;
    }
    this.tab = tab;

    if (this.tab === 'settings') {
      this.envVariablesForm = new EnvForm('', '', false);
      this.fetchAccessTokens();
    }
  }

  fetchRepository(): void {
    this.fetchingRepository = true;
    this.service.fetchRepository(this.id).subscribe(resp => {
      if (resp && resp.data) {
        const repo = resp.data;
        const provider = repo.repository_provider;
        let provider_id = null;
        switch (provider) {
          case 'github': provider_id = repo.github_id; break;
          case 'bitbucket': provider_id = repo.bitbucket_id; break;
          case 'gitlab': provider_id = repo.gitlab_id; break;
          case 'gogs': provider_id = repo.gogs_id; break;
        }

        this.repo = new Repository(
          repo.id,
          repo.name,
          repo.full_name,
          provider,
          provider_id,
          repo.html_url,
          repo.api_url,
          repo.default_branch,
          repo.description,
          Boolean(repo.fork),
          Boolean(repo.public),
          repo.access_tokens_id
        );
      }

      this.fetchingRepository = false;
    });
  }

  fetchAccessTokens(): void {
    this.fetchingAccessTokens = true;
    this.service.fetchAccessTokens().subscribe(resp => {
      if (resp && resp.data) {
        this.accessTokens = resp.data.map(token => {
          const user = new User(token.user.id, token.user.email, token.user.fullname, token.user.avatar, Boolean(token.user.admin));
          return new AccessToken(token.id, token.description, user);
        });

        this.tokenOptions = this.accessTokens.map(token => {
          return { value: token.id, placeholder: token.user.fullname + '`s ' + token.description };
        });

        this.fetchingAccessTokens = false;
      }
    });
  }

  checkRepositoryConfiguration(): void {
    this.service.checkRepositoryConfiguration(this.id).subscribe(resp => {
      console.log(resp);
    });
  }
}